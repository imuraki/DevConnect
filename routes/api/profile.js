const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const _ = require("lodash");

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile)
      return res.status(400).json({ msg: "There is no profile for the user" });

    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Internal server error");
  }
});

router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is Required").not().isEmpty(),
      check("skills", "Skills is Required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    let profileFields = _.pick(req.body, [
      "company",
      "location",
      "website",
      "bio",
      "skills",
      "status",
      "githubusername",
    ]);

    profileFields = {
      ...profileFields,
      user: req.user.id,
      skills: req.body.skills.split(",").map((skill) => skill.trim()),
      social: _.pick(req.body, [
        "youtube",
        "twitter",
        "instagram",
        "linkedin",
        "facebook",
      ]),
    };

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      profile = new Profile(profileFields);

      await profile.save();
    } catch (err) {
      console.log(err.message);
      res.send("Internal server error");
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    return res.json(profiles);
  } catch (err) {
    console.log(err.message);
    res.send("Internal server error");
  }
});

router.get("/user/:user_id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.user_id))
      return res.status(404).send("Profile Not Found");

    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) return res.status(404).send("Profile Not Found");

    return res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.send("Internal server error");
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    //@todo - remove users posts
    console.log(req.user);
    await Profile.findOneAndRemove({ user: req.user.id });
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: "User deleted" });
  } catch (err) {
    console.log(err.message);
    res.send("Internal server error");
  }
});

router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const experience = _.pick(req.body, [
      "title",
      "company",
      "location",
      "from",
      "to",
      "current",
      "description",
    ]);

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(experience);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.send("Internal server error");
    }
  }
);

router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get Remove index
    const removeindex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.id);

    profile.experience.splice(removeindex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.send("Internal server error");
  }
});

module.exports = router;
