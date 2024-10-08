import { StatusCodes } from 'http-status-codes';
import ms from 'ms';

import userService from '../../services/client/userService.js';

// [GET] /user/register
const registerPage = async (req, res) => {
    try {
        const accessToken = req.cookies?.accessToken;
        if (accessToken) {
            res.redirect(`/`);
            return;
        }

        res.render('client/pages/user/register', {
            pageTitle: 'Đăng ký',
        });
    } catch (error) {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
            message: 'Server Error!',
        });
    }
};

// [POST] /user/register
const registerUser = async (req, res) => {
    try {
        const newUser = await userService.createNew(req.body, res);
        if (newUser == 'emailExits') {
            res.status(StatusCodes.CONFLICT).json({
                message: 'Email đã tồn tại!',
            });
        } else {
            res.status(StatusCodes.OK).json({
                message: 'Tạo tài khoản thành công!',
            });
        }
    } catch (error) {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
            message: 'Server Error!',
        });
    }
};

// [GET] /user/login
const loginPage = async (req, res) => {
    try {
        const accessToken = req.cookies?.accessToken;
        if (accessToken) {
            res.redirect(`/`);
            return;
        }

        res.render('client/pages/user/login', {
            pageTitle: 'Đăng nhập',
        });
    } catch (error) {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
            message: 'Server Error!',
        });
    }
};

// [POST] /user/login
const loginUser = async (req, res) => {
    try {
        const user = await userService.login(req.body, res);
        if (user.userInfo) {
            res.status(StatusCodes.OK).json({
                message: user.message,
            });
        } else {
            res.status(StatusCodes.UNAUTHORIZED).json({
                message: user.message,
            });
        }
    } catch (error) {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
            message: 'Server Error!',
        });
    }
};

// [GET] /user/logout
const logoutUser = async (req, res) => {
    try {
        res.clearCookie('accessToken');
        res.redirect('/user/login');
    } catch (error) {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
            message: 'Server Error!',
        });
    }
};

export default {
    registerPage,
    registerUser,
    loginPage,
    loginUser,
    logoutUser,
};
