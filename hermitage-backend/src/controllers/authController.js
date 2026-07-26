import * as authService from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    const { user, token, refreshToken } = await authService.registerUser(req.body);
    res.status(201).json({
      status: 'success',
      token,
      refreshToken,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { user, token, refreshToken } = await authService.loginUser(req.body.email, req.body.password);
    res.status(200).json({
      status: 'success',
      token,
      refreshToken,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { token, refreshToken } = await authService.refreshUserToken(req.body.refreshToken);
    res.status(200).json({
      status: 'success',
      token,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.body.refreshToken);
    res.status(200).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
};

export const verifyAdmin = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { user: { role: req.user.role } },
  });
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

export const deleteMe = async (req, res, next) => {
  try {
    await authService.deleteMe(req.user.id);
    res.status(200).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
};
