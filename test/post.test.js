/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */
/* eslint-disable consistent-return */
const { expect } = require("chai")
const request = require("supertest")
const cloudinary = require("cloudinary").v2
const app = require("../server")
const postModel = require("../models/postModel")
const userModel = require("../models/userModel")

describe("Create a post", () => {
  describe("POST /api/post/", () => {
    let accessToken

    before((done) => {
      request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "securepassword",
        })
        .end((err, res) => {
          accessToken = res.body.access_token
          done()
        })
    })

    it("should create a new post", (done) => {
      const images = ["imageURL"]
      const caption = "Test caption"

      cloudinary.uploader.upload = async () => ({
        public_id: "test_public_id",
        secure_url: "test_secure_url",
      })
      request(app)
        .post("/api/post")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          images,
          caption,
        })
        .expect(200)
        .end((err, res) => {
          if (err) {
            console.error(err)
            return done(err)
          }
          console.log(res.body)
          expect(res.body).to.be.an("object")
          expect(res.body).to.have.property("message", "You successfully created a post.")
          done()
        })
    })

    it("should return an error if no images are provided", (done) => {
      const caption = "Test caption"

      request(app)
        .post("/api/post")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          caption,
          images: [],
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err)
          expect(res.body).to.have.property("message", "Image is compulsory to create a post.")
          done()
        })
    })

    it("should return a 500 error if an error occurs during the search process", (done) => {
      const images = ["imageURL"]
      const caption = "Test caption"

      cloudinary.uploader.upload = async () => ({
        public_id: "test_public_id",
        secure_url: "test_secure_url",
      })

      postModel.uploader.save = async () => {
        throw new Error("Database error")
      }

      request(app)
        .post("/api/post")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          caption,
          images,
        })
        .expect(500)
        .end((err, res) => {
          if (err) return done(err)
          expect(res.body).to.have.property("message", "Failed to create a post.")
          done()
        })
    })
  })
})

describe("Fetch all posts", () => {
  describe("GET /api/post/", () => {
    let accessToken
    let user

    before((done) => {
      request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "securepassword",
        })
        .end(async (err, res) => {
          accessToken = res.body.access_token
          user = await userModel.findOne({ email: "test@example.com" })
          done()
        })
    })

    it("should fetch all posts of the user and the users they are following", (done) => {
      const post1 = new postModel({
        caption: "Post 1 caption",
        images: [{
          public_id: "public_id_1",
          secure_url: "secure_url_1",
        }],
        user: "64c8bfd24d2d914fb9ea56a2",
      })
      const post2 = new postModel({
        caption: "Post 2 caption",
        images: [{
          public_id: "public_id_2",
          secure_url: "secure_url_2",
        }],
        user: user.following[0],
      })

      post1.save()
      post2.save()

      request(app)
        .get("/api/post")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)
          expect(res.body).to.have.property("message", "All posts fetched successfully.")
          expect(res.body.posts).to.be.an("array").with.lengthOf(2)
          done()
        })
    })

    it("should return a 400 error if no posts are found", (done) => {
      postModel.find = async () => []

      request(app)
        .get("/api/post")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err)
          expect(res.body).to.have.property("message", "There are no posts.")
          done()
        })
    })

    it("should return a 500 error if an error occurs during the fetching process", (done) => {
      postModel.find = async () => {
        throw new Error("Database error")
      }

      request(app)
        .get("/api/post")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(500)
        .end((err, res) => {
          if (err) return done(err)
          expect(res.body).to.have.property("message", "Failed to fetch the posts.")
          done()
        })
    })
  })
})

describe("Fetch a user", () => {
  describe("Get Single Post", () => {
    let accessToken
    let user

    before((done) => {
      request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password" })
        .end(async (err, res) => {
          accessToken = res.body.access_token
          user = await userModel.findOne({ email: "test@example.com" })
          done()
        })
    })

    describe("GET /api/post/:id", () => {
      it("should fetch a single post by ID", (done) => {
        const post = new postModel({
          caption: "Post caption",
          images: [{ public_id: "public_id", secure_url: "secure_url" }],
          user: "64c8bfd24d2d914fb9ea56a2",
        })

        post.save((err, singlePost) => {
          request(app)
            .get(`/api/post/${singlePost._id}`)
            .set("Authorization", `Bearer ${accessToken}`)
            .expect(200)
            .end((error, res) => {
              if (error) return done(error)
              expect(res.body).to.have.property("message", "Fetched the post successfully.")
              expect(res.body.post).to.have.property("caption", "Post caption")
              done()
            })
        })
      })

      it("should return a 400 error if no post is found with the given ID", (done) => {
        request(app)
          .get("/api/post/invalid_id")
          .set("Authorization", `Bearer ${accessToken}`)
          .expect(400)
          .end((err, res) => {
            if (err) return done(err)
            expect(res.body).to.have.property("message", "No post found with this ID.")
            done()
          })
      })

      it("should return a 500 error if an error occurs during the fetching process", (done) => {
        postModel.findById = async () => {
          throw new Error("Database error")
        }

        request(app)
          .get("/api/post/some_id")
          .set("Authorization", `Bearer ${accessToken}`)
          .expect(500)
          .end((err, res) => {
            if (err) return done(err)
            expect(res.body).to.have.property("message", "Failed to fetch the post.")
            done()
          })
      })
    })
  }).timeout(5000)
})

describe("Update Post", () => {
  let accessToken
  let user

  before((done) => {
    request(app)
      .post("/api/login")
      .send({
        email: "test@example.com",
        password: "password",
      })
      .end(async (err, res) => {
        accessToken = res.body.access_token
        user = await userModel.findOne({ email: "test@example.com" })
        done()
      })
  })

  describe("PATCH /api/post/:id", () => {
    it("should update a post by ID", (done) => {
      const post = new postModel({
        caption: "Old caption",
        images: [{
          public_id: "old_id",
          secure_url: "old_url",
        }],
        user: "64c8bfd24d2d914fb9ea56a2",
      })

      post.save((err, updatePost) => {
        request(app)
          .patch(`/api/post/${updatePost._id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send({
            caption: "Updated caption",
            images: [{
              public_id: "new_id",
              secure_url: "new_url",
            }],
          })
          .expect(200)
          .end((error, res) => {
            if (error) return done(error)
            expect(res.body).to.have.property("message", "Updated post successfully.")
            expect(res.body.post).to.have.property("caption", "Updated caption")
            done()
          })
      })
    })

    it("should return a 400 error if no post is found with the given ID", (done) => {
      request(app)
        .patch("/api/post/invalid_id")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          caption: "Updated caption",
          images: [{
            public_id: "new_id",
            secure_url: "new_url",
          }],
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err)
          expect(res.body).to.have.property("message", "No post found with this ID.")
          done()
        })
    })

    it("should return a 500 error if an error occurs during the update process", (done) => {
      postModel.findOneAndUpdate = async () => {
        throw new Error("Database error")
      }

      request(app)
        .patch("/api/post/some_id")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          caption: "Updated caption",
          images: [{
            public_id: "new_id",
            secure_url: "new_url",
          }],
        })
        .expect(500)
        .end((err, res) => {
          if (err) return done(err)
          expect(res.body).to.have.property("message", "Failed to update the post.")
          done()
        })
    })
  })
})

describe("Like and Unlike Post", () => {
  let accessToken
  let user
  let post

  before((done) => {
    request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "password",
      })
      .end(async (err, res) => {
        accessToken = res.body.access_token
        user = await userModel.findOne({ email: "test@example.com" })

        post = new postModel({
          caption: "Test post",
          images: [],
          user: "64c8bfd24d2d914fb9ea56a2",
        })

        post.save((error, savedPost) => {
          post = savedPost
          done()
        })
      })
  })

  describe("PATCH /api/post/like/:id", () => {
    it("should like a post by ID", (done) => {
      request(app)
        .patch(`/api/post/like/${post._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You successfully liked this post.")
          expect(res.body.like).to.have.property("_id", post._id.toString())
          done()
        })
    })

    it("should return a 400 error if the post is already liked", (done) => {
      request(app)
        .patch(`/api/post/like/${post._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You have already liked this post.")
          done()
        })
    })

    it("should return a 400 error if the post does not exist", (done) => {
      request(app)
        .patch("/api/post/like/invalid_id")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "Post does not exist with this ID.")
          done()
        })
    })
  })

  describe("PATCH /api/post/unlike/:id", () => {
    it("should unlike a post by ID", (done) => {
      request(app)
        .patch(`/api/post/unlike/${post._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You successfully unliked this post.")
          expect(res.body.unlike).to.have.property("_id", post._id.toString())
          done()
        })
    })

    it("should return a 400 error if the post is not liked", (done) => {
      request(app)
        .patch(`/api/post/unlike/${post._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You have not liked this post to unlike it")
          done()
        })
    })

    it("should return a 400 error if the post does not exist", (done) => {
      request(app)
        .patch("/api/post/unlike/invalid_id")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "Post does not exist with this ID.")
          done()
        })
    })
  })
})

describe("Save and Unsave Post", () => {
  let accessToken
  let user
  let post

  before((done) => {
    request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "password",
      })
      .end(async (err, res) => {
        accessToken = res.body.access_token
        user = await userModel.findOne({ email: "test@example.com" })

        post = new postModel({
          caption: "Test post",
          images: [],
          user: "64c8bfd24d2d914fb9ea56a2",
        })

        post.save((error, savedPost) => {
          post = savedPost
          done()
        })
      })
  })

  describe("PATCH /api/post/save/:id", () => {
    it("should save a post by ID", (done) => {
      request(app)
        .patch(`/api/post/save/${post._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You successfully saved this post.")
          expect(res.body.save.saved).to.include(post._id.toString())
          done()
        })
    })

    it("should return a 409 error if the post is already saved", (done) => {
      request(app)
        .patch(`/api/post/save/${post._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(409)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You have already saved this post.")
          done()
        })
    })

    it("should return a 400 error if the post does not exist", (done) => {
      request(app)
        .patch("/api/post/save/invalid_id")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "Post does not exist with this ID.")
          done()
        })
    })
  })

  describe("PATCH /api/post/unsave/:id", () => {
    before((done) => {
      userModel.findOneAndUpdate({ _id: user._id },
        { $push: { saved: post._id } },
        { new: true },
        (error, updatedUser) => {
          user = updatedUser
          done()
        })
    })

    it("should unsave a post by ID", (done) => {
      request(app)
        .patch(`/api/post/unsave/${post._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You successfully unsaved this post.")
          expect(res.body.unsave.saved).to.not.include(post._id.toString())
          done()
        })
    })

    it("should return a 400 error if the post is not saved", (done) => {
      request(app)
        .patch(`/api/post/unsave/${post._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You have not saved this post to unsave it")
          done()
        })
    })

    it("should return a 400 error if the post does not exist", (done) => {
      request(app)
        .patch("/api/post/unsave/invalid_id")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "Post does not exist with this ID.")
          done()
        })
    })
  })
})

describe("Delete Post", () => {
  let accessToken
  let user
  let post

  before((done) => {
    request(app)
      .post("/api/login")
      .send({ email: "test@example.com", password: "password" })
      .end(async (err, res) => {
        accessToken = res.body.access_token
        user = await userModel.findOne({ email: "test@example.com" })

        post = new postModel({
          caption: "Test post",
          images: [],
          user: user._id,
        })

        post.save((error, savedPost) => {
          post = savedPost
          done()
        })
      })
  })

  describe("DELETE /api/post/:id", () => {
    it("should delete a post by ID", (done) => {
      request(app)
        .delete(`/api/post/${post._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You successfully deleted this post.")
          expect(res.body.deletedPost._id).to.equal(post._id.toString())
          expect(res.body.deletedPostComment).to.be.an("object")
          done()
        })
    })

    it("should return a 400 error if the post does not exist", (done) => {
      request(app)
        .delete("/api/post/invalid_id")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "No post exists with this ID.")
          done()
        })
    })
  })
})