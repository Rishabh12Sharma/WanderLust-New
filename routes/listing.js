const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking.js");
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");


const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// Route to get all listings with optional filtering by city
router
  .route("/")
  .get(wrapAsync(listingController.index)) // Handles fetching all listings with optional city filter
  .post(
    isLoggedIn,
    upload.single('listing[image]'),
    validateListing,
    wrapAsync(listingController.createListing)
  );

// Route to render the form for creating a new listing
router.get("/new", isLoggedIn, listingController.renderNewForm);

// Routes for showing, updating, and deleting a specific listing by ID
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// Route to render the form for editing an existing listing
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));



// Route to display the booking form
router.get("/:id/book", isLoggedIn, wrapAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
  }
  res.render("BookingForm.ejs", { listing });
}));

// Route to handle form submission
router.post("/:id/book", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  const listing = await Listing.findById(id);
  if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
  }

  const newBooking = new Booking({
      listing: id,
      name,
      email,
      phone,
  });

  await newBooking.save();

  req.flash("success", "Booking successfully completed!");
  res.redirect(`/listings/${id}`);
}));

module.exports = router;