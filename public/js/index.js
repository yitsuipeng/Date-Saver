$("#hello > div.container > div > div > div.home_btns.m-top-40 > a.btn.btn-default.m-top-20").bind("click touch",function(){
    $('html,body').animate({scrollTop: ($($(this).attr('href')).offset().top - 50 )},500);
});