
# Social Media Application
This project is the backend of the social media application.

## Technologies Used
- MongoDB - For Database
- Express Js - Framework for backend
- NodeJs - Runtime Environment

## Introduction

In this application, user must login to view or create the post. No unauthorize user can create post, like and comment on it. A user should be authorized to create new post, like and comment on posts of other user as well as his/her. User can also follow and unfollow different user. There is also an option of updating the post and comment. User can also update his/her profile. 

## Functionalities 

1. User - 
    * User will be able to CRUD their profile.
    * Can visit other user's profile.
2. Authentication - 
    * User will be able to register on the app (invloves creating the user profile).
    * User will be able to login on the app if registered.
    * User will be able to logout from the app.
    * Only authenticated users will be able to perform CRUD on post, follow, like, comment, save etc.
3. Post - 
    * User will be able to create and update a post.
    * A post must include a image also it should contain some caption.
    * A user will be able to like, commenton a post and save the post
4. Follow -
    * Users will be able to follow each other.
5. Unfollow -
    * Users can also unfollow each other.

 
## Entities 
Following are the entities that are majorly defined on the server:
1. Users
2. Posts
3. Likes
4. Follows
5. Comments

## Tables define for entities

### Users Table

|_id|first_name|last_name|username|email|password|gender|time_stamp|
|---|---|---|---|---|---|---|---|
|ObjectId,unique|string|string|string, unique|string, unique|string, hashed|string|date_time|

### Posts Table

|_id|user|caption|images|time_stamps|
|---|---|---|---|---|
|ObjectId,unique|string|string|array|date_time|

### Comments Table

|_id|content|likes|time_stamps|
|---|---|---|---|
|ObjectId,unique|string|array|date_time|



## What is image File Upload?
File upload refers to the process of transferring digital files from a local device to a remote server or storage location using a network connection. It allows users to share and distribute files such as documents, images, videos, and other multimedia content across the internet.

You can store images directly to folder on our server but it is inefficient way to do. As the number of files increase or images and it will become difficult to access on the front end side.

You can make use of object storage to store the image files and use it's location URL on front end side. Whenever a user posts a post, we will create a uploader that will take the image file and push it to object storage service.

Some of the Cloud Services That Provide File Upload as a Service
1. Cloudinary
2. Dropbox
3. Amazon S3

Cloudinary is used for uploading and storing images in this project.

### What is Cloudinary 
Cloudinary is a cloud-based media management platform that provides file upload, storage, and delivery services for images, videos, and other digital assets. It simplifies the process of handling media files by offering on-the-fly manipulation, optimization, and transformation capabilities through a dynamic URL structure.
Cloudinary provides a pre-built file upload widget you can easily add to your site. Developers can also integrate Cloudinary into web and mobile applications using its APIs, SDKs, and pre-built UI components.

## Architecture Design
MVC architecture is used for this social media application

### What is MVC architecture
The Model-View-Controller (MVC) framework is an architectural/design pattern that separates an application into three main logical components Model, View, and Controller. Each architectural component is built to handle specific development aspects of an application. It isolates the business logic and presentation layer from each other.

## Setup
1. IDE - VS Code
2. NodeJS Version above 16.13.2
3. Cloudinary 

## Install dependencies for server 
### `npm install`

## Mongodb Atlas URL for connecting database, necessary tokens for authentication and credentials of cloudinary are added in .env file

## Run the Express server
1. Install nodemon module
2. Add start command in package.json file as "nodemon server.js" to run server.js file
3. In terminal use "npm start" command to start server

### Server runs on http://localhost:5000 




