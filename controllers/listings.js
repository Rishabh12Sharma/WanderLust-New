
const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geoCodingClient = mbxGeocoding({ accessToken: mapToken });


// Controller to display all listings
module.exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not specified
    const limit = 10; // Number of listings per page
    const skip = (page - 1) * limit; // Number of listings to skip based on the current page
    const city = req.query.city || ""; // City filter if provided

    // Build the filter query
    const filterQuery = city ? { location: city } : {};

    // Fetch the listings for the current page with pagination
    const listings = await Listing.find(filterQuery).skip(skip).limit(limit);
    const totalListings = await Listing.countDocuments(filterQuery); // Get the total number of listings
    const totalPages = Math.ceil(totalListings / limit); // Calculate total number of pages

    res.render("listings/index.ejs", {
      listings,
      city, // Pass city for filtering if provided
      page,
      totalPages,
    });
  } catch (err) {
    req.flash("error", "Something went wrong while fetching listings!");
    res.redirect("/listings");
  }
};



// Route to render form for creating a new listing
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// Show details of a specific listing
module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  try {
    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: {
          path: "author",
        },
      })
      .populate("owner");
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
  } catch (err) {
    req.flash("error", "Something went wrong while fetching the listing!");
    res.redirect("/listings");
  }
};

// Create a new listing
// Create a new listing
module.exports.createListing = async (req, res, next) => {
  try {
    // Geocode the location to get latitude and longitude
    let response = await geoCodingClient.forwardGeocode({
      query: req.body.listing.location,
      limit: 2,
    }).send();

    const url = req.file.path;
    const filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = response.body.features[0].geometry;

    // Remove this part, as you're no longer using availableRooms
    // newListing.availableRooms = newListing.totalRooms; // Set availableRooms to totalRooms initially

    // Save the new listing
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  } catch (err) {
    req.flash("error", "Error occurred while creating the listing!");
    res.redirect("/listings/new");
  }
};


// Render the form for editing an existing listing
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  try {
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

    res.render("listings/edit.ejs", { listing, originalImageUrl });
  } catch (err) {
    req.flash("error", "Error occurred while fetching the listing to edit!");
    res.redirect("/listings");
  }
};

// Update an existing listing
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  try {
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing does not exist!");
      return res.redirect("/listings");
    }

    // Update the listing's data
    listing.set(req.body.listing);

    // Update image if a new one was uploaded
    if (req.file) {
      const url = req.file.path;
      const filename = req.file.filename;
      listing.image = { url, filename };
    }

    // Save the updated listing
    await listing.save();
    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    req.flash("error", "Error occurred while updating the listing!");
    res.redirect(`/listings/${id}/edit`);
  }
};

// Delete a specific listing
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedListing = await Listing.findByIdAndDelete(id);
    if (!deletedListing) {
      req.flash("error", "Listing does not exist!");
      return res.redirect("/listings");
    }
    req.flash("success", "Listing Deleted");
    res.redirect("/listings");
  } catch (err) {
    req.flash("error", "Error occurred while deleting the listing!");
    res.redirect("/listings");
  }
};
