const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Clinic = require('../models/Clinic');
const Patient = require('../models/Patient');

// Protect all routes below
router.use(protect);

// --- MAIN ADMIN ROUTES (role: 'admin') ---
router.get('/overview', authorize('admin'), async (req, res) => {
  try {
    const clinics = await Clinic.countDocuments({ status: 'approved' });
    const patients = await Patient.countDocuments();
    const staff = await User.countDocuments({ role: 'staff', status: 'approved' });
    const subadmins = await User.countDocuments({ role: 'subadmin', status: 'approved' });
    res.json({ clinics, patients, staff, subadmins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/clinics', authorize('admin'), async (req, res) => {
  try {
    const clinics = await Clinic.find().sort({ createdAt: -1 });
    res.json(clinics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/patients', authorize('admin'), async (req, res) => {
  try {
    const patients = await Patient.find().select('-pin');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/accounts', authorize('admin'), async (req, res) => {
  try {
    const accounts = await User.find({ role: { $ne: 'admin' } }).select('-password');
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- CLINIC ADMIN ROUTES (role: 'subadmin') ---

// 1. Get Staff specific to this clinic
router.get('/clinic/staff', authorize('subadmin'), async (req, res) => {
  try {
    const staff = await User.find({ clinicId: req.user.clinicId, role: 'staff' }).select('-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Approve/Suspend Staff in this clinic
router.post('/clinic/staff/:username', authorize('subadmin'), async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findOne({ username: req.params.username, clinicId: req.user.clinicId, role: 'staff' });
    if (!user) return res.status(404).json({ message: 'Staff member not found in your clinic.' });
    
    user.status = status;
    await user.save();
    res.json({ message: `Staff status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Get Patients (In a real system, you'd filter by clinic visits. For this demo, we fetch all).
router.get('/clinic/patients', authorize('subadmin'), async (req, res) => {
  try {
    const patients = await Patient.find().select('-pin');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Get Clinic Overview (Wallet and Name)
router.get('/clinic/overview', authorize('subadmin'), async (req, res) => {
  try {
    const clinic = await Clinic.findOne({ id: req.user.clinicId });
    if (!clinic) return res.status(404).json({ message: 'Clinic not found' });
    
    res.json({
      name: clinic.name,
      balance: clinic.walletBalance,
      staffCount: await User.countDocuments({ clinicId: clinic.id, role: 'staff' })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;