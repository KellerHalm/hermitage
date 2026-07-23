import * as authService from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.registerUser(req.body);
    res.status(201).json({
      status: 'success',
      token,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.loginUser(req.body.email, req.body.password);
    res.status(200).json({
      status: 'success',
      token,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = (req, res) => {
  const user = { ...req.user };
  user.password = undefined;

  res.status(200).json({
    status: 'success',
    data: { user },
  });
};

export const updateMe = async (req, res, next) => {
  try {
    const user = await authService.updateUser(req.user.id, req.body);
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

