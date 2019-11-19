$(document).ready(function() {
    $('#login').click(e => {
        const email = $('#email').val();
        const password = $('#password').val();
        $.ajax({
            type: 'POST',
            url: '/login',
            data: JSON.stringify({
              'email': email,
              'password': password
            }),
            success: function(data) {
                console.log(data.result);
                if (data.result === 'LOGIN_SUCCESS') {
                    window.location.href = '/home';
                } else if (data.result === 'WRONG_EMAIL') {

                } else if (data.result === 'WRONG_PASSWORD') {

                }
            },
            dataType: 'json',
            contentType: 'application/json'
        });
    });
    $('#signup').click(e => {
        console.log(1);
        const email = $('#semail').val();
        const password = $('#spassword').val();
        $.ajax({
            type: 'POST',
            url: '/signup',
            data: JSON.stringify({
                'email': email,
                'password': password
            }),
            dataType: 'json',
            contentType: 'application/json'
        });
    });
});
