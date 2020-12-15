const host = 'd2cw5pt7i47jz6.cloudfront.net';
const token = window.localStorage.getItem('Authorization');
let data;

if(token){
    console.log('there is a token');

    fetch('user/profile', {
        method: 'GET',
        headers: new Headers({
        'Authorization': token
        })
    })
    .then(res => res.json()) //這裡要改成噴不同訊息要跳轉畫面  跟拿到payload要印在版面上
    .then(result => {
        console.log(result.data.user.picture);
        data = result.data;
        
        document.getElementById('user-picture').style.backgroundImage = `url(${data.user.picture})`;
        document.getElementById('user-name').innerHTML = data.user.name;
        document.getElementById('user-id').innerHTML = '會員號碼: '+data.user.id;
        document.getElementById('user-email').innerHTML = 'email: '+data.user.email;
        // let picture = document.createElement('img');
        // picture.setAttribute('src',data.data.user.picture);
        // document.getElementById('user-picture').appendChild(picture);
    })
    .catch(error => {
        console.error('Error:', error);
        return error;
    })

}
else{
    window.location.replace("sign.html");
}

