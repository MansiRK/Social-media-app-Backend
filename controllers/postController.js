/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */
// Import
// eslint-disable-next-line import/no-extraneous-dependencies
const cloudinary = require("cloudinary").v2
const postModel = require("../models/postModel")
const userModel = require("../models/userModel")
const commentModel = require("../models/commentModel")

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
})

// Create post
const createPost = async (req, res) => {
  try {
    const { caption, images } = req.body

    // Check if image is present
    if (images.length === 0) {
      return res.status(400).json({
        message: "Image is compulsory to create a post.",
      })
    }

    // Check if any of the images failed to upload
    // eslint-disable-next-line function-paren-newline
    const uploadedImages = await Promise.all(
      images.map(async (imageURL) => {
        try {
          // Upload image
          const uploadResult = await cloudinary.uploader.upload(imageURL, {
            upload_preset: process.env.UPLOAD_PRESET,
          })
          return {
            // Return public id and secure url
            public_id: uploadResult.public_id,
            secure_url: uploadResult.secure_url,
          }
        }
        catch (error) {
          // Response when upload fails
          return res.status(400).json({
            message: `Failed to upload image. ${error.message}`,
          })
        }
      }))

    // New post content
    const newPost = new postModel({
      caption,
      images: uploadedImages,
      user: req.user._id,
    })

    // Save in database
    await newPost.save()

    // Response when successful
    return res.status(200).json({
      message: "You successfully created a post.",
      newPost,
    })
  }
  catch (error) {
    // Response when error
    return res.status(500).json({
      message: `Failed to create a post. ${error.message}`,
    })
  }
}

// Get all posts
const getAllPosts = async (req, res) => {
  try {
    // Find posts
    const posts = await postModel.find({
      user: [
        req.user.following,
        req.user._id,
      ],
    }).sort("-createdAt")
      .populate("user likes", "avatar email firstname lastname username followers followings")

    // If no posts found
    if (posts.length === 0) {
      return res.status(400).json({
        message: "There are no posts.",
      })
    }

    // Response when successful
    return res.status(200).json({
      message: "All posts fetched successfully.",
      result: posts.length,
      posts,
    })
  }
  catch (error) {
    // Response when error
    return res.status(500).json({
      message: `Failed to fetch the posts. ${error.message}`,
    })
  }
}

// Get single post by ID
const getSinglePost = async (req, res) => {
  try {
    // Find post
    const fetchedPost = await postModel.findById({
      _id: req.params.id,
    })
      .populate("user likes", "avatar username email firstname lastname followers followings")

    // If no post found
    if (!fetchedPost) {
      return res.status(400).json({
        message: "No post found with this ID.",
      })
    }

    // Response when successful
    return res.status(200).json({
      message: "Fetched the post successfully.",
      fetchedPost,
    })
  }
  catch (error) {
    // Response when error
    return res.status(500).json({
      message: `Failed to fetch the post. ${error.message}`,
    })
  }
}

// Get posts of users by ID
const getUserPosts = async (req, res) => {
  try {
    // Find post
    const userPosts = await postModel.find({
      user: req.params.id,
    }).sort("-createdAt")
      .populate("user likes", "avatar email username firstname lastname followers followings")

    // If no post found
    if (!userPosts) {
      return res.status(400).json({
        message: "This user has no post.",
      })
    }

    // Response when successful
    return res.status(200).json({
      message: "Fetched all the posts from this user successfully.",
      result: userPosts.length,
      userPosts,
    })
  }
  catch (error) {
    // Response when error
    return res.status(500).json({
      message: `Failed to fetch posts of this user. ${error.message}`,
    })
  }
}

// Update post by ID
const updatePost = async (req, res) => {
  try {
    const { caption, images } = req.body

    // Find post
    const updatedPost = await postModel.findOneAndUpdate({
      _id: req.params.id,
    }, {
      caption, images,
    }, {
      new: true,
    }).populate("user likes", "avatar username firstname lastname email")

    // If no post found
    if (!updatedPost) {
      return res.status(400).json({
        message: "No post found with this ID.",
      })
    }

    // Response when successful
    return res.status(500).json({
      message: "Updated post successfully.",
      updatedPost,
    })
  }
  catch (error) {
    // Response when error
    return res.status(500).json({
      message: `Failed to update the post. ${error.message}`,
    })
  }
}

// Like post by ID
const likePost = async (req, res) => {
  try {
    // Find post
    const post = await postModel.find({
      _id: req.params.id,
      likes: req.user._id,
    })

    // If post is already liked
    if (post.length > 0) {
      return res.status(400).json({
        message: "You have already liked this post.",
      })
    }

    // Find and update post
    const likedPost = await postModel.findOneAndUpdate({
      _id: req.params.id,
    }, {
      $push: {
        likes: req.user._id,
      },
    }, {
      new: true,
    }).populate("likes user", "avatar username email firstname lastname followers followings")

    // If post does not exist
    if (!likedPost) {
      return res.status(400).json({
        message: "Post does not exist with this ID.",
      })
    }

    // Response when successful
    return res.status(200).json({
      message: "You successfully liked this post.",
      likedPost,
    })
  }
  catch (error) {
    // Response when error
    return res.status(500).json({
      message: `Failed to like this post. ${error.message}`,
    })
  }
}

// Unlike post by ID
const unlikePost = async (req, res) => {
  try {
    // Find post
    const post = await postModel.find({
      _id: req.params.id,
    })

    // If post does not exist
    if (post.length === 0) {
      return res.status(400).json({
        message: "Post does not exist with this ID.",
      })
    }

    // Find and update post
    const unlikedPost = await postModel.findOneAndUpdate({
      _id: req.params.id,
      likes: req.user._id,
    }, {
      $pull: {
        likes: req.user._id,
      },
    }, {
      new: true,
    }).populate("likes user", "avatar username email firstname lastname followers followings")

    // If post is not liked
    if (!unlikedPost) {
      return res.status(400).json({
        message: "You have not liked this post to unlike it",
      })
    }
    // Response when successful
    return res.status(200).json({
      message: "You successfully unliked this post.",
      unlikedPost,
    })
  }
  catch (error) {
    // Response when error
    return res.status(500).json({
      message: `Failed to unlike this post. ${error.message}`,
    })
  }
}

// Save post by ID
const savePost = async (req, res) => {
  try {
    // Find post
    const savedPost = await postModel.find({
      _id: req.params.id,
    })

    // Check if post exists
    if (savedPost.length === 0) {
      return res.status(400).json({
        message: "Post does not exist with this ID.",
      })
    }

    // Find post in user model
    const user = await userModel.findOne({
      _id: req.user._id,
      saved: req.params.id,
    })

    // Check if post is present
    if (user) {
      return res.status(409).json({
        message: "You have already saved this post.",
      })
    }

    // Find and update user
    const savedPostByUser = await userModel.findOneAndUpdate({
      _id: req.user._id,
    }, {
      $push: {
        saved: req.params.id,
      },
    }, {
      new: true,
    })

    // Response when successful
    return res.status(200).json({
      message: "You successfully saved this post.",
      savedPostByUser,
      savedPost,
    })
  }
  catch (error) {
  // Response when error
    return res.status(500).json({
      message: `Failed to save this post. ${error.message}`,
    })
  }
}

// Unsave post by ID
const unsavePost = async (req, res) => {
  try {
    // Find post
    const unsavedPost = await postModel.find({
      _id: req.params.id,
    })

    // Check if post exists
    if (unsavedPost.length === 0) {
      return res.status(400).json({
        message: "Post does not exist with this ID.",
      })
    }

    // Find post in user model
    const user = await userModel.findOne({
      _id: req.user._id,
      saved: req.params.id,
    })

    // Check if post is present in saved
    if (!user) {
      return res.status(400).json({
        message: "You have not saved this post to unsave it.",
      })
    }

    // Find and update user
    const unsavedPostByUser = await userModel.findOneAndUpdate({
      _id: req.user._id,
    }, {
      $pull: {
        saved: req.params.id,
      },
    }, {
      new: true,
    })

    // Response when successful
    return res.status(200).json({
      message: "You successfully unsaved this post.",
      unsavedPost,
      unsavedPostByUser,
    })
  }
  catch (error) {
    // Response when error
    return res.status(500).json({
      message: `Failed to unsave this post. ${error.message}`,
    })
  }
}

// Delete post by ID
const deletePost = async (req, res) => {
  try {
    // Find post
    const postExist = await postModel.find({
      _id: req.params.id,
    })

    // Check if exists
    if (!postExist) {
      return res.status(400).json({
        message: "No post exists with this ID.",
      })
    }

    // Find and delete post
    const deletedPost = await postModel.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    })

    // Check if owner is deleting
    if (!deletedPost) {
      return res.status(400).json({
        message: "You cannot delete this post. You are not the owner of this post.",
      })
    }

    // Delete post comments
    const deletedPostComment = await commentModel.deleteMany({
      _id: {
        $in: deletedPost.comments,
      },
    })

    // Response when successful
    return res.status(200).json({
      message: "You successfully deleted this post.",
      deletedPost,
      deletedPostComment,
    })
  }
  catch (error) {
    // Response when error
    return res.status(500).json({
      message: `Failed to delete this post. ${error.message}`,
    })
  }
}

// Export
module.exports = {
  createPost,
  getAllPosts,
  getSinglePost,
  getUserPosts,
  updatePost,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  deletePost,
}