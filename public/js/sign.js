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
    if(!upInputName.value||!upInputPassword.value||!upInputEmail.value){
        alert('請完成全部欄位');
    }else{
        console.log('signup info complete');

        fetch('user/signup', {
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json'
                }),
            body:JSON.stringify({'name':upInputName.value,
            'email':upInputEmail.value,
            'password':upInputPassword.value
        })})
        // .then(res => res.json())
        .then(res => res.json())
        .then(result => {
            console.log(result);
            if(result.data.access_token){

                window.localStorage.setItem('Authorization', 'Bearer '+result.data.access_token);
                successAlert(result.data.username);
                
            }else{
                Swal.fire({
                    icon: 'error',
                    title: '哎呀',
                    text: result.data,
                    confirmButtonColor: '#ff6863'
                });
            }
            console.log('Success:', result);
            return result;
        })
        .catch(error => {
            console.error('Error:', error);
            return error;
        })
    }   
});

inButton.addEventListener('click',function(){ //新增項目
    if(!inInputPassword.value||!inInputEmail.value){
        alert('請完成全部欄位');
    }else{
        console.log('signin info complete');

        fetch('user/signin', {
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json'
                }),
            body:JSON.stringify({'provider':'native',
            'email':inInputEmail.value,
            'password':inInputPassword.value
        })})
        .then(res => res.json())
        .then(result => {

            if(result.data.access_token){

                window.localStorage.setItem('Authorization', 'Bearer '+result.data.access_token);
                successAlert(result.data.username);

            }else{
                Swal.fire({
                    icon: 'error',
                    title: '哎呀',
                    text: result.data,
                    confirmButtonColor: '#ff6863'
                });
            }
            console.log('Success:', result);
            return result;
        })
        .catch(error => {
            console.error('Error:', error);
            return error;
        })
    }   
});


// facebook
function statusChangeCallback(response) {  // Called with the results from FB.getLoginStatus().

    console.log(response.status);                   // The current login status of the person.
    if (response.status === 'connected') {   // Logged into your webpage and Facebook.
        console.log(response.authResponse.accessToken);

        fetch('user/signin', {
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json'
                }),
            body:JSON.stringify({'provider':'facebook',
            'access_token':response.authResponse.accessToken
        })})
        .then(res => res.json())
        .then(result => {
            if(result.data.access_token){

                window.localStorage.setItem('Authorization', 'Bearer '+result.data.access_token);
                successAlert(result.data.username);

            }else{
                Swal.fire({
                    icon: 'error',
                    title: '哎呀',
                    text: result.data,
                    confirmButtonColor: '#ff6863'
                });
            }
            console.log('Success:', result);
            return result;
        })
        .catch(error => {
            console.error('Error:', error);
            return error;
        })


    } else {                                 // Not logged into your webpage or we are unable to tell.
        console.log('need to login');
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

function warningAlert(warning){

    Swal.fire({
        title: '哎呀',
        text: warning,
        icon: 'warning',
        showConfirmButton: false,
        timer: 1500
      }).then(()=>{
             
        window.location.replace("sign.html");
      });

}
 
