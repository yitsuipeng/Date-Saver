// const host = window.location.host;
const host = 'd2cw5pt7i47jz6.cloudfront.net';
const token = window.localStorage.getItem('Authorization');

let map;
let markers = [];
let blogs = {};
let styles = [
    {
      featureType: 'water',
      stylers: [
        { color: '#A3D9F0' }
      ]
    },{
      featureType: 'administrative',
      elementType: 'labels.text.stroke',
      stylers: [
        { color: '#ffffff' },
        { weight: 6 },
        { visibility: 'off' }
      ]
    },{
      featureType: 'administrative',
      elementType: 'labels.text.fill',
      stylers: [
        { color: '#e85113' },
        { visibility: 'off' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [
        { color: '#efe9e4' },
        { lightness: -40 }
      ]
    },{
      featureType: 'transit.station',
      stylers: [
        { weight: 3 },
        { hue: '#e85113' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'labels.icon',
      stylers: [
        { visibility: 'off' }
      ]
    },{
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [
        { lightness: 100 }
      ]
    },{
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [
        { lightness: -100 }
      ]
    },{
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [
        { visibility: 'on' },
        { color: '#f0e4d3' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [
        { color: '#efe9e4' },
        { lightness: -25 }
      ]
    },{
      featureType: "road",
      elementType: "labels",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },{
      featureType: "poi",
      elementType: "labels.text",
      stylers: [
        { visibility: 'on' }
      ]
    }
  ];
let socket = io();

async function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: {lat:25.0591607,lng:121.5387777},
        styles: styles,
        // mapTypeControl: true
      });
}


fetch(`api/1.0/hot`, {
    method: 'GET',
    headers: new Headers({
        'Authorization': token
    })
})
.then(res => res.json())
.then(res => {

    console.log(res.data);

    for(let x of res.data){

        blogs[x.id] = x;
        let content = `<div class="col-md-4 open-the-box">
            <div class="blog_item m-top-20">
                <div class="blog_item_img" title="${x.id}">
                    <img class="imgimgimg" src="https://${host}/date-saver/shares/${x.photo}" alt="" />
                </div>
                <div class="blog_text roomy-40">
                    <h6><strong>${x.name}</strong></h6>
                    <p><em>${x.date} / ${JSON.parse(x.details)[0].name}</em></p>
                    <p id="${x.id}">${x.view}次點閱</p>
                </div>
            </div>
        </div>`;
        document.getElementById('canvas').innerHTML += content;
    }

    console.log(blogs);

    document.getElementById('canvas').addEventListener('click', (e) => {

        let pin = e.target;

        if(pin.className == 'imgimgimg'){

            document.getElementById("plan-name").innerText = blogs[pin.parentNode.title].name;
            let pinArray = JSON.parse(blogs[pin.parentNode.title].details);
            document.getElementById("plan-comment").innerHTML = blogs[pin.parentNode.title].comment;
            document.getElementById("plan-details").innerHTML =  `<ul><li><i class="fa fa-check-circle text-primary"></i> ${pinArray[0].name}</li><li>${pinArray[0].address}</li></ul><br>`;

            removeMarkers(markers);
            markers=[];

            let marker = new google.maps.Marker({
                position: pinArray[0].location,
                map: map,
                title: blogs[pin.parentNode.title].name,
                label: "1"
            });

            markers.push(marker);
            map.setCenter(pinArray[0].location);

            for(let i=1; i<pinArray.length; i++){

                document.getElementById("plan-details").innerHTML += `<ul><li><i class="fa fa-check-circle text-primary"></i> ${pinArray[i].name}</li><li> ${pinArray[i].address} </li><li> ${pinArray[i].mode} / ${pinArray[i].distance.text} / 約 ${pinArray[i].duration.text}</li></ul><br>`;

                marker = new google.maps.Marker({
                    position: pinArray[i].location,
                    map: map,
                    title: pinArray[i].name,
                    label: (i+1).toString()
                });
                markers.push(marker);
                map.getBounds().extend(pinArray[i].location); 

            }

            addView(pin.parentNode.title);
            blogs[pin.parentNode.title].view += 1;
            document.getElementById(`${pin.parentNode.title}`).innerText = blogs[pin.parentNode.title].view+'次點閱';
            document.getElementById("myModal").style.display = "block";
        }
        
    })

    document.getElementsByClassName("close")[0].onclick = function() {
        document.getElementById("myModal").style.display = "none";
    }
    
    window.onclick = function(event) {
      if (event.target == document.getElementById("myModal")) {
          document.getElementById("myModal").style.display = "none";
      }
    }

})
.catch(error => {
    console.error('Error:', error);
    alert('系統錯誤,請稍後再試');
    return error;
});

function turnTimeText(time){
    let output =[];
    output[0] = Math.floor(time/3600);
    output[1] = Math.round(time%3600/60);
    return output;
  
}

function removeMarkers(markers) {
    if(markers.length !== 0){
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
    }
}

function addView(id){
  
    let newView = {id: id, view: blogs[id].view};
    console.log(newView);
    socket.emit('addView',newView);

}

socket.on('send', (msg)=>{
  console.log(msg);
  blogs[msg.id].view = msg.view;
  document.getElementById(`${msg.id}`).innerText = blogs[msg.id].view+'次點閱';
  
});

{/* <p><em>${x.date} / ${(x.total_distance/1000).toFixed(1)} 公里 / ${turnTimeText(x.total_duration)[0]}小時 ${turnTimeText(x.total_duration)[1]}分鐘 </em></p> */}