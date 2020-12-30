// const host = window.location.host;
const host = 'd2cw5pt7i47jz6.cloudfront.net';
const token = window.localStorage.getItem('Authorization');

if(token){
    fetch(`user/verifyUser`, {
        method: 'GET',
        headers: new Headers({
            'Authorization': token
        })
    })
    .then(res => res.json())
    .then(res => {
    if(res.data.access_token){
        window.location.replace("profile.html");
    }
    else{
        console.log(res)
    }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('系統錯誤,請稍後再試');
        return error;
    });
}


let upButton = document.querySelector('#upButton');
let upInputName = document.querySelector('#upInputName');
let upInputEmail = document.querySelector('#upInputEmail');
let upInputPassword = document.querySelector('#upInputPassword');

let inButton = document.querySelector('#inButton');
let inInputEmail = document.querySelector('#inInputEmail');
let inInputPassword = document.querySelector('#inInputPassword');

upButton.addEventListener('click',function(){ //新增項目

    fetchAPI('signup', {
        'name':upInputName.value,
        'email':upInputEmail.value,
        'password':upInputPassword.value
    });
    // fetch('api/1.0/signup', {
    //     method: 'POST',
    //     headers: new Headers({
    //         'Content-Type': 'application/json'
    //         }),
    //     body:JSON.stringify({'name':upInputName.value,
    //     'email':upInputEmail.value,
    //     'password':upInputPassword.value
    // })})
    // .then(res => res.json())
    // .then(result => {
    //     console.log(result);
    //     if(result.data){

    //         window.localStorage.setItem('Authorization', 'Bearer '+result.data.access_token);
    //         successAlert(result.data.username);
            
    //     }else{
    //         Swal.fire({
    //             icon: 'error',
    //             title: '哎呀',
    //             text: result.error,
    //             confirmButtonColor: '#ff6863'
    //         });
    //     }
    //     return result;
    // })
    // .catch(error => {
    //     Swal.fire({
    //         icon: 'error',
    //         title: '哎呀',
    //         text: error,
    //         confirmButtonColor: '#ff6863'
    //     });
    //     return error;
    // })
  
});

inButton.addEventListener('click',function(){ //新增項目

    fetchAPI('signin', {
        'provider':'native',
        'email':inInputEmail.value,
        'password':inInputPassword.value
    });

});


// facebook
function statusChangeCallback(response) {  // Called with the results from FB.getLoginStatus().

    if (response.status === 'connected') {   // Logged into your webpage and Facebook.
        console.log(response.authResponse.accessToken);

        fetchAPI('signin',{'provider':'facebook',
        'access_token':response.authResponse.accessToken
        });

    } else {                                 // Not logged into your webpage or we are unable to tell.
        Swal.fire({
            icon: 'error',
            title: '哎呀',
            text: 'Facebook登入錯誤',
            confirmButtonColor: '#ff6863'
        });
    }
}

function checkLoginState() {  // Called when a person is finished with the Login Button.
    FB.getLoginStatus(function(response) {   // See the onlogin handler
        statusChangeCallback(response);
    });
}

window.fbAsyncInit = function() {
    FB.init({
        appId      : '1192657334449088',
        cookie     : true,                     // Enable cookies to allow the server to access the session.
        xfbml      : true,                     // Parse social plugins on this webpage.
        version    : 'v9.0'           // Use this Graph API version for this call.
    });

};

function successAlert(name){

    Swal.fire({
        icon: 'success',
        title: `Hi ${name}, 歡迎`,
        showConfirmButton: false,
        timer: 1500
    }).then(()=>{
            
        window.location.replace("planning.html");

    });

}

function fetchAPI(api,body){

    fetch('api/1.0/'+api, {
        method: 'POST',
        headers: new Headers({
            'Content-Type': 'application/json'
            }),
        body:JSON.stringify(body)})
    .then(res => res.json())
    .then(result => {
        console.log(result);
        if(result.data){

            window.localStorage.setItem('Authorization', 'Bearer '+result.data.access_token);
            successAlert(result.data.username);
            
        }else{
            Swal.fire({
                icon: 'error',
                title: '哎呀',
                text: result.error,
                confirmButtonColor: '#ff6863'
            });
        }
        return result;
    })
    .catch(error => {
        Swal.fire({
            icon: 'error',
            title: '哎呀',
            text: error,
            confirmButtonColor: '#ff6863'
        });
        return error;
    })

}


$(document).ready(function(){
    $('.login-info-box').fadeOut();
    $('.login-show').addClass('show-log-panel');
});


$('.login-reg-panel input[type="radio"]').on('change', function() {
    if($('#log-login-show').is(':checked')) {
        $('.register-info-box').fadeOut(); 
        $('.login-info-box').fadeIn();
        
        $('.white-panel').addClass('right-log');
        $('.register-show').addClass('show-log-panel');
        $('.login-show').removeClass('show-log-panel');
        
    }
    else if($('#log-reg-show').is(':checked')) {
        $('.register-info-box').fadeIn();
        $('.login-info-box').fadeOut();
        
        $('.white-panel').removeClass('right-log');
        
        $('.login-show').addClass('show-log-panel');
        $('.register-show').removeClass('show-log-panel');
    }
});
