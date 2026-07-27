import * as authService from '../services/authService.js';
import { config } from '../config/index.js';

const parseDuration = (duration) => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const num = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return num * multipliers[unit];
};

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'strict',
  path: '/',
  domain: config.cookieDomain,
  maxAge,
});

const setTokenCookies = (res, token, refreshToken) => {
  const accessMaxAge = parseDuration(config.jwtExpiresIn);
  const refreshMaxAge = parseDuration(config.jwtRefreshExpiresIn);
  res.cookie(ACCESS_COOKIE, token, cookieOptions(accessMaxAge));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(refreshMaxAge));
};

const clearTokenCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth/refresh' });
};

export const register = async (req, res, next) => {
  try {
    const { user, token, refreshToken } = await authService.registerUser(req.body);
    setTokenCookies(res, token, refreshToken);
    res.status(201).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { user, token, refreshToken } = await authService.loginUser(req.body.email, req.body.password);
    setTokenCookies(res, token, refreshToken);
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    const { token, refreshToken } = await authService.refreshUserToken(incomingRefreshToken);
    setTokenCookies(res, token, refreshToken);
    res.status(200).json({
      status: 'success',
    });
  } catch (error) {
    clearTokenCookies(res);
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    await authService.logoutUser(refreshToken);
    clearTokenCookies(res);
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
