import { checkValidate } from './validate.js';
import SweetAlert from './SweetAlert.js';

// Register
const formRegister = document.querySelector('.form-register');

if (formRegister) {
    const btnRegister = formRegister.querySelector('.btn-register');
    btnRegister.addEventListener('click', function () {
        let isValid = checkValidate('register');
        if (isValid) {
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const userData = {
                fullName: fullName,
                email: email,
                password: password,
            };
            handleUser(userData, 'register');
        }
    });
}

const formLogin = document.querySelector('.form-login');
if (formLogin) {
    const btnLogin = formLogin.querySelector('.btn-login');
    btnLogin.addEventListener('click', function () {
        let isValid = checkValidate('login');
        if (isValid) {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const userData = {
                email: email,
                password: password,
            };
            handleUser(userData, 'login');
        }
    });
}

const handleUser = async (data, type) => {
    try {
        const response = await fetch(
            `/user/${type == 'login' ? 'login' : 'register'}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            },
        );

        const status = response.status;
        const result = await response.json();

        if (status == 200) {
            SweetAlert.noticeSuccess(result.message, {
                willClose: () => {
                    window.location.href = '/';
                },
            });
        } else {
            SweetAlert.noticeTopRight(result.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        SweetAlert.noticeTopRight(result.message || 'Server Error!');
    }
};
