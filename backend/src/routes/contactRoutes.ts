import { Router } from 'express';
import { getContacts, addContact, updateContact, deleteContact } from '../controllers/contactController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getContacts);
router.post('/', addContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;
