/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable consistent-return */
/* eslint-disable new-cap */
const { expect } = require("chai")
const request = require("supertest")
const app = require("../server")
const commentModel = require("../models/commentModel")
const userModel = require("../models/userModel")
const postModel = require("../models/postModel")

describe("Create Comment", () => {
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

  describe("POST /api/comment", () => {
    it("should create a new comment on a post", (done) => {
      const commentContent = "This is a test comment"

      request(app)
        .post("/api/comment")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: commentContent,
          postId: "64c96e879f714317ff7f42c5",
          postUserId: "64c8bfd24d2d914fb9ea56a2",
        })
        .expect(200)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You created a comment successfully.")
          expect(res.body.newComment).to.be.an("object")
          expect(res.body.newComment.content).to.equal(commentContent)
          done()
        })
    })

    it("should return a 400 error if the post does not exist", (done) => {
      request(app)
        .post("/api/comment")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "This is a test comment",
          postId: "invalid_id",
          postUserId: "64c8bfd24d2d914fb9ea56a2",
        })
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "This post does not exist.")
          done()
        })
    })
  })
})

describe("Update Comment", () => {
  let accessToken
  let user
  let comment

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

        const newComment = new commentModel({
          user: "64c8bfd24d2d914fb9ea56a2",
          content: "Test comment",
          postId: "some_post_id",
          postUserId: "some_post_user_id",
        })

        newComment.save((error, savedComment) => {
          comment = savedComment
          done()
        })
      })
  })

  describe("PATCH /api/comment/:id", () => {
    it("should update a comment", (done) => {
      const updatedContent = "Updated comment content"
      const comment_id = "64cbe29bee9cdb87a8528de4"

      request(app)
        .patch(`/api/comment/${comment_id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: updatedContent,
        })
        .expect(200)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You have successfully updated this comment.")
          expect(res.body.updatedComment).to.be.an("object")
          expect(res.body.updatedComment.content).to.equal(updatedContent)
          done()
        })
    })

    it("should return a 500 error if an error occurs during the update process", (done) => {
      commentModel.findOneAndUpdate = async () => {
        throw new Error("Database error")
      }

      const comment_id = "64cbe29bee9cdb87a8528de4"

      request(app)
        .patch(`/api/comment/${comment_id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Updated comment content",
        })
        .expect(500)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "Failed to update the comment.")
          done()
        })
    })
  })
})

describe("Like and Unlike Comment", () => {
  let accessToken
  let user
  let comment

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

        const newComment = new commentModel({
          user: "64c8bfd24d2d914fb9ea56a2",
          content: "Test comment",
          postId: "some_post_id",
          postUserId: "some_post_user_id",
        })

        newComment.save((error, savedComment) => {
          comment = savedComment
          done()
        })
      })
  })

  describe("POST /api/comment/:id/like", () => {
    it("should like a comment", (done) => {
      const comment_id = "64cbe29bee9cdb87a8528de4"

      request(app)
        .patch(`/api/comment/like/${comment_id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You successfully liked this comment.")
          expect(res.body.likedComment).to.be.an("object")
          expect(res.body.likedComment.likes).to.include(user.toString())
          done()
        })
    })

    it("should return a 400 error if the comment does not exist", (done) => {
      commentModel.findById = async () => null

      const comment_id = "64cbe29bee9cdb87a8528de4"

      request(app)
        .patch(`/api/comment/like/${comment_id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "No comment exists with this ID.")
          done()
        })
    })

    it("should return a 400 error if the user has already liked the comment", (done) => {
      commentModel.find = async () => [comment]

      const comment_id = "64cbe29bee9cdb87a8528de4"

      request(app)
        .patch(`/api/comment/like/${comment_id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You have already liked this comment.")
          done()
        })
    })
  })

  describe("PATCH /api/comment/unlike/:id", () => {
    it("should unlike a comment", (done) => {
      commentModel.find = async () => [comment]

      const comment_id = "64cbe29bee9cdb87a8528de4"

      request(app)
        .patch(`/api/comment/unlike/${comment_id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You have successfully unliked this comment.")
          expect(res.body.unlikedComment).to.be.an("object")
          expect(res.body.unlikedComment.likes).to.not.include(user.toString())
          done()
        })
    })

    it("should return a 400 error if the comment does not exist", (done) => {
      commentModel.findById = async () => null

      const comment_id = "64cbe29bee9cdb87a8528de4"

      request(app)
        .patch(`/api/comment/unlike/${comment_id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "No comment exists with this ID.")
          done()
        })
    })

    it("should return a 400 error if the user has not liked the comment to unlike it", (done) => {
      commentModel.find = async () => []

      const comment_id = "64cbe29bee9cdb87a8528de4"

      request(app)
        .patch(`/api/comment/unlike/${comment_id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You have not liked this comment to unlike it.")
          done()
        })
    })
  })
})

describe("Delete Comment", () => {
  let accessToken
  let user
  let comment
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

        const newPost = new postModel({
          caption: "Test post",
          images: [],
          user: "64c8bfd24d2d914fb9ea56a2",
        })

        newPost.save(async (error, savedPost) => {
          post = savedPost

          const newComment = new commentModel({
            user: "64c8bfd24d2d914fb9ea56a2",
            content: "Test comment",
            postId: post._id,
            postUserId: post.user.toString(),
          })

          newComment.save((error, savedComment) => {
            comment = savedComment
            done()
          })
        })
      })
  })

  describe("DELETE /api/comment/:id", () => {
    it("should delete a comment created by the user", (done) => {
      commentModel.findOneAndDelete = async () => comment

      const comment_id = "64cbe29bee9cdb87a8528de4"
      request(app)
        .delete(`/api/comment/${comment_id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You successfully deleted this comment.")
          expect(res.body.deletedComment).to.be.an("object")
          done()
        })
    })

    it("should delete a comment if the user is the owner of the post", (done) => {
      commentModel.findOneAndDelete = async () => comment

      const comment_id = "64cbe29bee9cdb87a8528de4"
      request(app)
        .delete(`/api/comment/${comment_id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You successfully deleted this comment.")
          expect(res.body.deletedComment).to.be.an("object")
          done()
        })
    })

    it("should return a 400 error if the comment does not exist", (done) => {
      commentModel.findById = async () => null

      request(app)
        .delete(`/api/comment/${comment._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "No comment exist with this ID.")
          done()
        })
    })

    it("should return a 400 error if the user is neither the creator of the comment nor the owner of the post", (done) => {
      commentModel.findOneAndDelete = async () => null

      request(app)
        .delete(`/api/comment/${comment._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400)
        .end((error, res) => {
          if (error) return done(error)
          expect(res.body).to.have.property("message", "You cannot delete this comment. You are not creater of comment or owner of post.")
          done()
        })
    })

    // Add more test cases as needed
  })
})