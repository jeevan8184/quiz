import React, { useEffect, useRef, useState } from "react";
import {
  InputAdornment,
  Button,
  IconButton,
  Dialog,
  DialogContent,
  Tabs,
  Tab,
  TextField,
} from "@mui/material";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  itemVariants,
  type GifImage,
  type UnsplashImage,
  type UploadedContent,
} from "./constants";

// Corrected Material-UI Icon Imports
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";

const ImageDialog = ({
  openDialog,
  unsplashImages,
  gifsImages,
  loadMoreImages,
  loadMoreGifs,
  isLoading,
  fetchUnsplashImages,
  fetchGifsImages,
  updateQuestionOption,
  selectedOptionIndex,
  index,
  setUploadedContent,
  handleImageUpload,
  uploadedContent,
  setOpenDialog,
  setSelectedOptionIndex,
}: {
  openDialog: boolean;
  unsplashImages: UnsplashImage[];
  gifsImages: GifImage[];
  loadMoreImages: (query: string) => void;
  loadMoreGifs: (query: string) => void;
  isLoading: boolean;
  fetchUnsplashImages: (page: number, query?: string, append?: boolean) => void;
  fetchGifsImages: (page: number, query?: string, append?: boolean) => void;
  updateQuestionOption: (
    questionIndex: number,
    optionIndex: number,
    value:
      | string
      | { type: "image"; url: string; file: File; description: string }
  ) => void;
  selectedOptionIndex: number | null;
  index: number;
  setUploadedContent: (content: UploadedContent | null) => void;
  handleImageUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    optIndex: number
  ) => void;
  uploadedContent: UploadedContent | null;
  setOpenDialog: (open: boolean) => void;
  setSelectedOptionIndex: (index: number | null) => void;
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [gifQuery, setGifQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [editingImage, setEditingImage] = useState<UploadedContent | null>(
    null
  );
  const observerRef = useRef<HTMLDivElement | null>(null);
  const giphyRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (selectedOptionIndex === null) return;
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      setEditingImage({ type: "image", name: file.name, url, file });
    } else {
      toast.error("Please drop an image file (e.g., PNG, JPEG).");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedOptionIndex === null) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setEditingImage({ type: "image", name: file.name, url, file });
      } else {
        toast.error("Please upload an image file (e.g., PNG, JPEG).");
      }
    }
  };

  const handleImageSelect = (url: string, name: string, file?: File) => {
    setEditingImage({ type: "image", name, url, file });
  };

  const handleSaveImage = async () => {
    if (selectedOptionIndex === null || !editingImage) return;
    updateQuestionOption(index, selectedOptionIndex, {
      type: "image",
      url: editingImage.url,
      file: editingImage.file || new File([], editingImage.name),
      description: "",
    });
    setUploadedContent(editingImage);
    toast.success(`Image selected for option ${selectedOptionIndex + 1}`);
    handleCloseDialog();
  };

  const handleBackToSelection = () => {
    setEditingImage(null);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    fetchUnsplashImages(1, query);
  };

  const handleGifSearchChange = (query: string) => {
    setGifQuery(query);
    fetchGifsImages(1, query);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOptionIndex(null);
    setSearchQuery("");
    setGifQuery("");
    setUploadedContent(null);
    setEditingImage(null);
  };

  const viewUploadedFile = () => {
    if (uploadedContent?.url) {
      window.open(uploadedContent.url, "_blank");
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1 && !searchQuery) {
      fetchUnsplashImages(1);
    } else if (newValue === 2 && !gifQuery) {
      fetchGifsImages(1);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoading &&
          tabValue === 1 &&
          !editingImage
        ) {
          loadMoreImages(searchQuery);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [isLoading, tabValue, loadMoreImages, searchQuery, editingImage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoading &&
          tabValue === 2 &&
          !editingImage
        ) {
          loadMoreGifs(gifQuery);
        }
      },
      { threshold: 0.1 }
    );

    if (giphyRef.current) {
      observer.observe(giphyRef.current);
    }

    return () => {
      if (giphyRef.current) {
        observer.unobserve(giphyRef.current);
      }
    };
  }, [isLoading, tabValue, loadMoreGifs, gifQuery, editingImage]);

  return (
    <Dialog
      open={openDialog}
      onClose={handleCloseDialog}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        style: {
          background:
            "linear-gradient(145deg, rgba(15, 12, 41, 0.95), rgba(25, 20, 60, 0.95))",
          backdropFilter: "blur(12px)",
          color: "#e0f2fe",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(0, 255, 255, 0.2)",
          border: "1px solid rgba(0, 255, 255, 0.25)",
          minHeight: "85vh",
          maxHeight: "85vh",
        },
      }}
    >
      <div className="relative h-full flex flex-col">
        <IconButton
          onClick={handleCloseDialog}
          className="absolute top-4 right-4 z-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300"
          sx={{
            border: "1px solid rgba(0, 255, 255, 0.4)",
            borderRadius: "12px",
            padding: "8px",
          }}
        >
          <CloseIcon className="text-cyan-200 hover:text-white transition-colors" />
        </IconButton>

        <DialogContent className="p-0 flex flex-col flex-grow overflow-hidden">
          {editingImage ? (
            <motion.div
              className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-gray-900/80 to-cyan-900/20 rounded-2xl"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="relative max-w-lg w-full h-[300px] mb-8 rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                <img
                  src={editingImage.url}
                  alt="Normal display"
                  className="w-full h-full object-contain bg-gray-900/80 rounded-2xl"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleBackToSelection}
                  className="relative bg-transparent border-2 border-cyan-400 text-cyan-200 font-semibold text-base rounded-xl px-6 py-3 transition-all duration-300 hover:bg-cyan-400/10 hover:border-cyan-300 hover:shadow-[0_0_12px_rgba(0,255,255,0.4)]"
                >
                  Back to Upload
                </button>
                <button
                  onClick={handleSaveImage}
                  className="relative bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-base rounded-xl px-6 py-3 shadow-[0_0_12px_rgba(0,255,255,0.5)] transition-all duration-300 hover:from-cyan-600 hover:to-blue-600 hover:shadow-[0_0_20px_rgba(0,255,255,0.7)]"
                >
                  Save Image
                </button>
              </div>
              <p className="mt-4 text-sm text-cyan-100/80">
                Selected: {editingImage.name}
              </p>
            </motion.div>
          ) : (
            <>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                className="px-6 pt-4"
                TabIndicatorProps={{
                  className:
                    "bg-gradient-to-r from-cyan-400 to-blue-400 h-[3px] rounded-t",
                }}
                sx={{
                  "& .MuiTab-root": {
                    color: "#a5b4fc",
                    fontWeight: "500",
                    fontSize: "1rem",
                    textTransform: "none",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      color: "#0ff",
                      backgroundColor: "rgba(0, 255, 255, 0.08)",
                    },
                    "&.Mui-selected": {
                      color: "#0ff",
                      fontWeight: "600",
                      backgroundColor: "rgba(0, 255, 255, 0.1)",
                    },
                  },
                }}
              >
                <Tab label="Upload from Device" />
                <Tab label="Unsplash Library" />
                <Tab label="Gifs" />
              </Tabs>

              <div className="flex-grow overflow-y-auto p-6">
                {tabValue === 0 && (
                  <div className="h-full flex flex-col">
                    <div
                      className={`flex-grow rounded-2xl p-8 text-center border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 ${
                        isDragging
                          ? "border-cyan-400 bg-cyan-400/20 shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                          : "border-cyan-400/40 bg-cyan-900/10"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="max-w-md mx-auto">
                        <AddPhotoAlternateIcon className="text-6xl text-cyan-300 mb-4 mx-auto transition-transform duration-300 hover:scale-110" />
                        <h4 className="text-xl font-semibold text-cyan-200 mb-3">
                          Drag & Drop Images Here
                        </h4>
                        <p className="text-sm text-cyan-100/80 mb-6">
                          Or browse your device to upload question images
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            ref={imageInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <Button
                            onClick={() => imageInputRef.current?.click()}
                            variant="outlined"
                            startIcon={<AddPhotoAlternateIcon />}
                            sx={{
                              color: "#0ff",
                              borderColor: "rgba(0, 255, 255, 0.5)",
                              borderRadius: "12px",
                              padding: "10px 24px",
                              fontWeight: "500",
                              "&:hover": {
                                borderColor: "#0ff",
                                backgroundColor: "rgba(0, 255, 255, 0.15)",
                                boxShadow: "0 0 12px rgba(0, 255, 255, 0.3)",
                              },
                            }}
                          >
                            Browse Files
                          </Button>
                          {uploadedContent &&
                            uploadedContent.type === "image" && (
                              <Button
                                onClick={viewUploadedFile}
                                variant="outlined"
                                startIcon={<VisibilityIcon />}
                                sx={{
                                  color: "#0ff",
                                  borderColor: "rgba(0, 255, 255, 0.5)",
                                  borderRadius: "12px",
                                  padding: "10px 24px",
                                  fontWeight: "500",
                                  "&:hover": {
                                    borderColor: "#0ff",
                                    backgroundColor: "rgba(0, 255, 255, 0.15)",
                                    boxShadow:
                                      "0 0 12px rgba(0, 255, 255, 0.3)",
                                  },
                                }}
                              >
                                Preview Image
                              </Button>
                            )}
                        </div>
                        <div className="mt-6 text-xs text-cyan-300/80">
                          <p>Supports: JPG, PNG, WebP (Max 10MB per image)</p>
                          {uploadedContent &&
                            uploadedContent.type === "image" && (
                              <p className="mt-2 text-cyan-100">
                                Current: {uploadedContent.name}
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tabValue === 1 && (
                  <div className="h-full flex flex-col">
                    <TextField
                      fullWidth
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search Unsplash for images..."
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon className="text-cyan-300" />
                          </InputAdornment>
                        ),
                        sx: {
                          color: "#e0f2fe",
                          borderRadius: "12px",
                          backgroundColor: "rgba(0, 255, 255, 0.05)",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(0, 255, 255, 0.3)",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(0, 255, 255, 0.5)",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#0ff",
                            boxShadow: "0 0 0 3px rgba(0, 255, 255, 0.2)",
                          },
                        },
                      }}
                      sx={{
                        mb: 3,
                        "& .MuiInputBase-input::placeholder": {
                          color: "#94a3b8",
                          opacity: 1,
                        },
                      }}
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {unsplashImages.length > 0 ? (
                        unsplashImages.map((image) => (
                          <motion.div
                            key={image.id}
                            whileHover={{
                              scale: 1.03,
                              transition: { duration: 0.2 },
                            }}
                            whileTap={{ scale: 0.97 }}
                            className="relative group cursor-pointer"
                            onClick={() =>
                              selectedOptionIndex !== null &&
                              handleImageSelect(
                                image.urls.small,
                                "Unsplash Image"
                              )
                            }
                          >
                            <img
                              src={`${image.urls.small}?w=300&h=200&fit=crop&auto=format`}
                              alt="Unsplash"
                              className="w-full h-40 object-cover rounded-xl border border-cyan-500/30 shadow-[0_0_8px_rgba(0,255,255,0.2)]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-end p-3">
                              <span className="text-white text-sm font-medium bg-cyan-500/80 px-3 py-1 rounded-lg">
                                Select Image
                              </span>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center py-12 col-span-full">
                          <SearchOffIcon className="text-5xl text-cyan-300/50 mb-4" />
                          <h4 className="text-lg font-medium text-cyan-100 mb-2">
                            No images found
                          </h4>
                          <p className="text-sm text-cyan-100/70 max-w-md">
                            Try a different search term or browse our upload
                            options
                          </p>
                        </div>
                      )}
                    </div>
                    {unsplashImages.length > 0 && (
                      <div
                        ref={observerRef}
                        className="h-10 flex items-center justify-center"
                      >
                        {isLoading && (
                          <div className="text-cyan-300 text-sm animate-pulse">
                            Loading more images...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {tabValue === 2 && (
                  <div className="h-full flex flex-col">
                    <TextField
                      fullWidth
                      value={gifQuery}
                      onChange={(e) => handleGifSearchChange(e.target.value)}
                      placeholder="Search Giphy for GIFs..."
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon className="text-cyan-300" />
                          </InputAdornment>
                        ),
                        sx: {
                          color: "#e0f2fe",
                          borderRadius: "12px",
                          backgroundColor: "rgba(0, 255, 255, 0.05)",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(0, 255, 255, 0.3)",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(0, 255, 255, 0.5)",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#0ff",
                            boxShadow: "0 0 0 3px rgba(0, 255, 255, 0.2)",
                          },
                        },
                      }}
                      sx={{
                        mb: 3,
                        "& .MuiInputBase-input::placeholder": {
                          color: "#94a3b8",
                          opacity: 1,
                        },
                      }}
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {gifsImages.length > 0 ? (
                        gifsImages.map((gif) => (
                          <motion.div
                            key={gif.id}
                            whileHover={{
                              scale: 1.03,
                              transition: { duration: 0.2 },
                            }}
                            whileTap={{ scale: 0.97 }}
                            className="relative group cursor-pointer"
                            onClick={() =>
                              selectedOptionIndex !== null &&
                              handleImageSelect(gif.urls.small, "Giphy GIF")
                            }
                          >
                            <img
                              src={`${gif.urls.small}?w=300&h=200&fit=crop&auto=format`}
                              alt="Giphy"
                              className="w-full h-40 object-cover rounded-xl border border-cyan-500/30 shadow-[0_0_8px_rgba(0,255,255,0.2)]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-end p-3">
                              <span className="text-white text-sm font-medium bg-cyan-500/80 px-3 py-1 rounded-lg">
                                Select GIF
                              </span>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center py-12 col-span-full">
                          <SearchOffIcon className="text-5xl text-cyan-300/50 mb-4" />
                          <h4 className="text-lg font-medium text-cyan-100 mb-2">
                            No GIFs found
                          </h4>
                          <p className="text-sm text-cyan-100/70 max-w-md">
                            Try a different search term or browse our upload
                            options
                          </p>
                        </div>
                      )}
                    </div>
                    {gifsImages.length > 0 && (
                      <div
                        ref={giphyRef}
                        className="h-10 flex items-center justify-center"
                      >
                        {isLoading && (
                          <div className="text-cyan-300 text-sm animate-pulse">
                            Loading more GIFs...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default ImageDialog;
