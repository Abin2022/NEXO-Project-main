editingUserProfile: async (req, res) => {
  try {
      console.log(req.files, 'userimage');
      const id = new mongoose.Types.ObjectId(req.session.user_id);
      const userData = await User.findById({ _id: id }).lean();

      if (!userData) {
          throw new Error('User data not found');
      }

      let updatedUserData = {
          image: userData.image, // Use the previous image data as the starting point
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile
      };
      if (req.file) {
          // Check if a new image file is uploaded
          updatedUserData.image = req.file.filename; // Update with the new image filename
      }

      const updatedUser = await User.findByIdAndUpdate({ _id: id }, { $set: updatedUserData }, { new: true });
      res.redirect('/user-profile');
  } catch (error) {
      console.log(error.message);
      res.redirect('/user-error')
  }
},