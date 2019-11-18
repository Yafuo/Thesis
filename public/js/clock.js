$(document).ready(function () {
    var p = {name: '', cost: ''};
    var pack = [{packCost: '50000', packName: '1 hour'}
    , {packCost: '150000', packName: '3 hours'}
    , {packCost: '1000000', packName: '1 day'}];
    $('#booking').addClass('disabled');
    pack.forEach( (p, i) => {
        $('.package').append(`<tr data-placement="bottom" data-toggle="popover" title="${p.packName} Package" data-content="And here's some amazing content. It's very engaging. Right?" class="pack pack${i}" data-ab="${i}"><td>${p.packName}</td></tr>`);
    });
    // $('#booking').click( function (e)  {
    //     console.log(parkingSlotsJS);
    // });
    $(".package").delegate('tr','click', null, function (e) {
        $('.pack').removeClass('bg-green');
        var i = $(this).data()['ab'];
        p.cost = pack[i].packCost;
        p.name = pack[i].packName;
        $('[data-toggle=popover]').popover('hide');
        var that = this;
        pack.forEach((p, index) => {
            if (index === i) {
                $(that).popover('show');
            }
        });
        $(`.pack${i}`).addClass('bg-green');
        $('#booking').removeClass('disabled');
    });
    $('#booking').click(e => {
        var date = Date.now().toString();
        var d = {
            partnerCode: 'MOMO',
                accessKey: 'F8BBA842ECF85',
                requestId: 'UIT'+ date,
                amount: p.cost,
                orderId: 'UIT'+ date,
                orderInfo: p.name,
                returnUrl: 'https://820d7b05.ngrok.io',
                notifyUrl: 'https://820d7b05.ngrok.io/receive-notify',
                requestType: 'captureMoMoWallet',
                extraData: 'abc@gmail.com',
        }
        var data = `partnerCode=${d.partnerCode}&accessKey=${d.accessKey}&requestId=${d.requestId}&amount=${d.amount}&orderId=${d.orderId}&orderInfo=${d.orderInfo}&returnUrl=${d.returnUrl}&notifyUrl=${d.notifyUrl}&extraData=${d.extraData}`;
        var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
        var signature = CryptoJS.HmacSHA256(data, secretKey);
        d.signature = signature.toString(CryptoJS.enc.Hex);
        // console.log(d);
        // console.log(signature.toString(CryptoJS.enc.Hex));
        $.ajax({
            type: 'POST',
            url: 'https://test-payment.momo.vn/gw_payment/transactionProcessor',
            data: JSON.stringify(d),
            crossDomain: true,
            success: function (data) {
                var prefix = 'https://test-payment.momo.vn/gw_payment/qrcode/image/receipt?key=';
                var qrUrl = prefix + data.qrCodeUrl.slice(42);
                // console.log(data);
                // console.log(qrUrl);
                $('#qr-code').attr('src', qrUrl);
            },
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            dataType: 'json',
            contentType: 'application/json; charset=UTF-8'
        });
    });
});
