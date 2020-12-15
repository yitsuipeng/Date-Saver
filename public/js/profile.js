const host = 'd2cw5pt7i47jz6.cloudfront.net';
const token = window.localStorage.getItem('Authorization');

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
        console.log(result);

        return ;
    })
    .catch(error => {
        console.error('Error:', error);
        return error;
    })

}
else{
    window.location.replace("sign.html");
}