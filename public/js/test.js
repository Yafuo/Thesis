$(document).ready(function () {
   $('.popup').click(function () {
       var name = $('#usr').val();
       var pwd = $('#pwd').val();
       alert(`Username: ${name}\nPassword: ${pwd}`);
   });
});
