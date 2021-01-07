const host = 'd2cw5pt7i47jz6.cloudfront.net';
const token = window.localStorage.getItem('Authorization');
let data;
let orders={};

if(token){

    fetch('api/1.0/getProfile', {
        method: 'GET',
        headers: new Headers({
        'Authorization': token
        })
    })
    .then(res => res.json()) //這裡要改成噴不同訊息要跳轉畫面  跟拿到payload要印在版面上
    .then(result => {
        if(result.data.user){
            console.log(result.data);
            data = result.data;
            let shares = 0;
            let views = 0;
            let photoUrl = data.user.picture? data.user.picture : `https://${host}/date-saver/users/unnamed.jpg`;
            
            for(let x of data.order){
                orders[x.id] = x
                if(x.comment != null){
                    shares += 1;
                }
                views += x.view;
            }
    
            document.getElementById('user-picture').style.backgroundImage = `url(${photoUrl})`;
            document.getElementById('user-name').innerHTML = data.user.name;
            document.getElementById('user-email').innerHTML = 'email: '+data.user.email;
            document.getElementById('order-count').innerText = data.order.length;
            document.getElementById('post-count').innerText = shares;
            document.getElementById('view-count').innerText = views;
    
            showCalendar(data.order);
    
            // let picture = document.createElement('img');
            // picture.setAttribute('src',data.data.user.picture);
            // document.getElementById('user-picture').appendChild(picture);

        }else{

            warningAlert(result);
            // alert(result.data);
            // window.localStorage.removeItem('Authorization');
            // window.location.replace("sign.html");
        }

    })
    .catch(error => {
        warningAlert('登入過期，請重新登入');

    })

}
else{
    warningAlert('請先登入喔');
}

function showCalendar(dataOrder) {
    var calendarEl = document.getElementById('calendar');

    let orderArray = dataOrder.map(e => {return{id: e.id, title: e.name, start: e.date}});
    console.log(orderArray);
  
    var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      initialDate: new Date(),
      height: "auto",
      eventColor: '#ff6863',
      events: orderArray,
      eventClick: function(info) {
        showOrderDetails(info.event.id);
      },
      eventMouseEnter: function(info){
        info.el.style.backgroundColor= "lightpink";
      },
      eventMouseLeave: function(info){
        info.el.style.backgroundColor= '#ff6863';
      }
    });
  
    calendar.render();
}

function showOrderDetails(target){

    document.getElementById('order-name').innerHTML = orders[target].name;
    document.getElementById('order-double').innerHTML = (orders[target].total_distance/1000).toFixed(1) +'公里 / ' + turnTimeText(orders[target].total_duration)[0] + '小時 '+turnTimeText(orders[target].total_duration)[1]+'分鐘';

    let details = JSON.parse(orders[target].details);

    document.getElementById('details').innerHTML = `<br><ul><li><i class="fa fa-check-circle text-primary"></i> ${details[0].name}</li><li>${details[0].address}</li></ul><br>`;
    document.getElementById('order-id').setAttribute("value",orders[target].id);

    for(let i=1 ; i<details.length ; i++){
        let content = `<ul><li><i class="fa fa-check-circle text-primary"></i> ${details[i].name}</li><li> ${details[i].address} </li><li> ${details[i].mode} / ${details[i].distance.text} / 約 ${details[i].duration.text}</li></ul><br>`;
        document.getElementById('details').innerHTML += content;
    }

    if(orders[target].comment){
        document.getElementById('comment-form').style.display = "none";
        document.getElementById('comment').innerHTML = `<img src="https://${host}/date-saver/shares/${orders[target].photo}" class="m-top-20"><p>${orders[target].comment}</p>`;
        document.getElementById('comment').style.display = "block";
    }else{
        document.getElementById('comment-form').style.display = "block";
        document.getElementById('comment').style.display = "none";
    }

}

function turnTimeText(time){
    let output =[];
    output[0] = Math.floor(time/3600);
    output[1] = Math.round(time%3600/60);
    return output;
  
}

function warningAlert(warning){

    Swal.fire({
        title: '哎呀',
        text: warning,
        icon: 'warning',
        showConfirmButton: false,
        timer: 1500
    }).then(()=>{
        window.localStorage.removeItem('Authorization');
        window.location.replace("sign.html");
    });

}

function countToNumber (element, number, prefix, suffix, duration) {
    $({count: parseInt(element.text().split("+")[0].replace(/\,/g, ''))}).animate({count: number}, {
      duration: duration ? duration : 1000,
      easing: 'swing', 
      step: function (now) {
        element.text((prefix + Math.floor(now) + suffix).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
      },
      complete: function () {
        countingFromZero = false;
      }
    });
}