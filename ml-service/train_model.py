import os
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

def generate_synthetic_dataset(n_samples=6000, anomaly_ratio=0.05, seed=42):
    np.random.seed(seed)
    n_anomalies = int(n_samples * anomaly_ratio)
    n_normal = n_samples - n_anomalies

    # 1. Normal journeys
    # distance_from_route_m: 0 to 120m
    dist_route_normal = np.random.exponential(scale=35.0, size=n_normal)
    dist_route_normal = np.clip(dist_route_normal, 0, 180)

    # speed_kmh: 15 to 65 km/h for city public transport/auto/metro
    speed_normal = np.random.normal(loc=35.0, scale=12.0, size=n_normal)
    speed_normal = np.clip(speed_normal, 5.0, 80.0)

    # stop_duration_min: short stops 0 to 4 mins (traffic light/bus stop)
    stop_normal = np.random.exponential(scale=1.2, size=n_normal)
    stop_normal = np.clip(stop_normal, 0, 5.0)

    # direction_change_deg: smooth turns 0 to 45 deg
    dir_normal = np.abs(np.random.normal(loc=0.0, scale=15.0, size=n_normal))
    dir_normal = np.clip(dir_normal, 0, 60)

    # journey_delay_min: 0 to 8 min
    delay_normal = np.random.exponential(scale=2.0, size=n_normal)
    delay_normal = np.clip(delay_normal, 0, 10.0)

    # distance_to_destination_km: 0.5 to 25 km
    dist_dest_normal = np.random.uniform(0.5, 25.0, size=n_normal)

    normal_df = pd.DataFrame({
        'distance_from_route_m': dist_route_normal,
        'speed_kmh': speed_normal,
        'stop_duration_min': stop_normal,
        'direction_change_deg': dir_normal,
        'journey_delay_min': delay_normal,
        'distance_to_destination_km': dist_dest_normal,
        'is_anomaly': 0
    })

    # 2. Anomalous journeys (5% realistic anomalous combinations)
    # Type A: Major route deviation (700m to 3500m)
    n_a = n_anomalies // 3
    dist_route_a = np.random.uniform(600.0, 3500.0, size=n_a)
    speed_a = np.random.uniform(10.0, 60.0, size=n_a)
    stop_a = np.random.uniform(1.0, 15.0, size=n_a)
    dir_a = np.random.uniform(45.0, 180.0, size=n_a)
    delay_a = np.random.uniform(10.0, 45.0, size=n_a)
    dist_dest_a = np.random.uniform(2.0, 20.0, size=n_a)

    anom_a = pd.DataFrame({
        'distance_from_route_m': dist_route_a,
        'speed_kmh': speed_a,
        'stop_duration_min': stop_a,
        'direction_change_deg': dir_a,
        'journey_delay_min': delay_a,
        'distance_to_destination_km': dist_dest_a,
        'is_anomaly': 1
    })

    # Type B: Prolonged suspicious stop in isolated zone + delay
    n_b = n_anomalies // 3
    dist_route_b = np.random.uniform(150.0, 1200.0, size=n_b)
    speed_b = np.random.uniform(0.0, 4.0, size=n_b)  # stopped/crawling
    stop_b = np.random.uniform(12.0, 50.0, size=n_b) # 12 to 50 min stop!
    dir_b = np.random.uniform(10.0, 90.0, size=n_b)
    delay_b = np.random.uniform(15.0, 60.0, size=n_b)
    dist_dest_b = np.random.uniform(1.0, 15.0, size=n_b)

    anom_b = pd.DataFrame({
        'distance_from_route_m': dist_route_b,
        'speed_kmh': speed_b,
        'stop_duration_min': stop_b,
        'direction_change_deg': dir_b,
        'journey_delay_min': delay_b,
        'distance_to_destination_km': dist_dest_b,
        'is_anomaly': 1
    })

    # Type C: Severe directional flip / U-turn away from destination
    n_c = n_anomalies - (n_a + n_b)
    dist_route_c = np.random.uniform(500.0, 2500.0, size=n_c)
    speed_c = np.random.uniform(40.0, 85.0, size=n_c)
    stop_c = np.random.uniform(0.0, 8.0, size=n_c)
    dir_c = np.random.uniform(120.0, 180.0, size=n_c) # sharp backturn
    delay_c = np.random.uniform(20.0, 55.0, size=n_c)
    dist_dest_c = np.random.uniform(5.0, 30.0, size=n_c)

    anom_c = pd.DataFrame({
        'distance_from_route_m': dist_route_c,
        'speed_kmh': speed_c,
        'stop_duration_min': stop_c,
        'direction_change_deg': dir_c,
        'journey_delay_min': delay_c,
        'distance_to_destination_km': dist_dest_c,
        'is_anomaly': 1
    })

    df = pd.concat([normal_df, anom_a, anom_b, anom_c], ignore_index=True)
    df = df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    return df

def train_isolation_forest():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, 'dataset.csv')
    model_path = os.path.join(script_dir, 'isolation_forest.pkl')
    scaler_path = os.path.join(script_dir, 'scaler.pkl')

    print("Generating synthetic journey safety dataset (6,000 records)...")
    df = generate_synthetic_dataset(n_samples=6000, anomaly_ratio=0.05, seed=42)
    df.to_csv(dataset_path, index=False)
    print(f"Dataset saved to {dataset_path}")

    feature_cols = [
        'distance_from_route_m',
        'speed_kmh',
        'stop_duration_min',
        'direction_change_deg',
        'journey_delay_min',
        'distance_to_destination_km'
    ]

    X = df[feature_cols].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    print("Training Isolation Forest model (n_estimators=200, contamination=0.05)...")
    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        random_state=42
    )
    model.fit(X_scaled)

    # Evaluate decision function bounds for normalization to 0-100 risk score
    scores = model.decision_function(X_scaled) # higher = more normal, lower = more anomalous
    preds = model.predict(X_scaled) # 1 = normal, -1 = anomaly

    print(f"Training completed. Anomaly count predicted: {(preds == -1).sum()} / {len(preds)}")
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"Model saved to {model_path}")
    print(f"Scaler saved to {scaler_path}")

if __name__ == '__main__':
    train_isolation_forest()
