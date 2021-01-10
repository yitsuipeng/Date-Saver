# Date Saver
Website Link: https://date-saver.online/

![image](https://s3-ap-northeast-1.amazonaws.com/stylisherin.site/date-saver/readme/index-static.PNG)
> Date-Saver is a dating-oriented trip planning website that makes dating easier.
> It helps users explore dating hot spots in Taipei area, select their desired destinations on an interactive map and schedule them.
> Users can also get travel itinerary, manage date records and share your comments with public.

## Table of Contents
<ul>
  <li>
    <a href="#Technologies">Technologies</a>
  </li>
  <li>
    <a href="#Architecture">Architecture</a>
  </li>
  <li>
    <a href="#Database schema">Database schema</a>
  </li>
  <li>
    <a href="#Features">Features</a>
  </li>
  <li>
    <a href="#Demo Account">Demo Account</a>
  </li>
  <li>
    <a href="#Contact">Contact</a>
  </li>
</ul>

## Technologies
### Backend
- Node.js / Express.js
- RESTful API
- NGINX
- Socket.IO
### Front-End
- HTML
- CSS
- JavaScript
- Boostrap
- AJAX
### Cloud Service (AWS)
- Compute: EC2
- Storage: S3
- Database: RDS
- Network: CloudFront
### Database
- MySQL
### Tools
- Version Control: Git, GitHub
- Test: Mocha, Chai
- Agile: Trello (Scrum)
### Others
- Design Pattern: MVC

## Architecture
![image](https://s3-ap-northeast-1.amazonaws.com/stylisherin.site/date-saver/readme/workflow.png)

## Database schema
![image](https://s3-ap-northeast-1.amazonaws.com/stylisherin.site/date-saver/readme/structure.PNG)

## Features
#### 開始旅程
1. Place searching
- enter the start point to explore dating hot spots nearby
- current version only supported locations in great Taipei area
2. Schedule planning
- click the desired places listed to see the location on the map and check the details
- add / drop the desired places by plus and minus label
- places can be dragged to reorder
- press "依最短距離排序" to schedule the shortest path according to the first location
- press "匯出路徑" to obtain the summary of travel itinerary
3. Save the plan
- after naming this date and selecting the time, the plan will be shown on the personal calendar
![image](https://github.com/yitsuipeng/resume/blob/master/v2.3.gif)

#### 熱門旅程
- tap each photo to see the indivisual comment and travel itinerary
- the number of visitors is demonstrated synchronously on different windows
![image](https://s3-ap-northeast-1.amazonaws.com/stylisherin.site/date-saver/readme/hot.PNG)

#### 我的約會
- login / register
![image](https://s3-ap-northeast-1.amazonaws.com/stylisherin.site/date-saver/readme/sign_new.PNG)
- personal profile
![image](https://s3-ap-northeast-1.amazonaws.com/stylisherin.site/date-saver/readme/profile.PNG)

## Demo Account
- Email: demo@demo.com
- Password: demo

## Contact
email: yitsuipeng@gmail.com
