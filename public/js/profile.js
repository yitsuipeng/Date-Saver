const host = 'd2cw5pt7i47jz6.cloudfront.net';
const token = window.localStorage.getItem('Authorization');
let data;
let orders={};

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
        console.log(result.data);
        data = result.data;
        
        for(let x of data.order){
            orders[x.name] = x
        }

        document.getElementById('user-picture').style.backgroundImage = `url(${data.user.picture})`;
        document.getElementById('user-name').innerHTML = data.user.name;
        document.getElementById('user-email').innerHTML = 'email: '+data.user.email;
        document.getElementById('order-count').innerHTML = data.order.length;
        document.getElementById('post-count').innerHTML = data.order.length;

        showCalendar(data.order);

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

function showCalendar(dataOrder) {
    var calendarEl = document.getElementById('calendar');

    let orderArray = dataOrder.map(e => {return{title: e.name, start: e.date}});
    console.log(orderArray);
  
    var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      initialDate: new Date(),
      height: "auto",
      eventColor: '#ff6863',
      events: orderArray,
      eventClick: function(info) {
        showOrderDetails(info.event.title);
        info.el.style.eventColor = '#lightpink';
      }   
    
    });
  
    calendar.render();
  }

function showOrderDetails(target){
    document.getElementById('order-name').innerHTML = target;
    document.getElementById('order-double').innerHTML = (orders[target].total_distance/1000).toFixed(1) +'公里 / ' + turnTimeText(orders[target].total_duration)[0] + '小時 '+turnTimeText(orders[target].total_duration)[1]+'分鐘';

    let details = JSON.parse(orders[target].details);

    document.getElementById('details').innerHTML = `<h6 class="m-top-20">${details[0].name}</h6>`;
    document.getElementById('order-id').setAttribute("value",orders[target].id);

    for(let i=1 ; i<details.length ; i++){
        let content = `<h6 class="m-top-20">${details[i].name}</h6><p>${details[i].distance.text} / ${details[i].duration.text} / ${details[i].address}</p>`;
        document.getElementById('details').innerHTML += content;
    }

}

function turnTimeText(time){
    let output =[];
    output[0] = Math.floor(time/3600);
    output[1] = Math.round(time%3600/60);
    return output;
  
}
