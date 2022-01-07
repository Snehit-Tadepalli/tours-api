const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController.js');
const userController = require('../controllers/userController.js');

router.post(`/signup`, authController.signup);
router.post(`/login`, authController.login);

router.post(`/forgotPassword`, authController.forgotPassword);
router.patch(`/resetPassword/:token`, authController.resetPassword);
router.patch(
  `/updateMyPassword/:token`,
  authController.protect,
  authController.updatePassword
);

router
  .route(`/`)
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
