import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CircularProgress, Dialog, DialogContent } from "@mui/material";
import { containerVariants, itemVariants } from "~/components/constants";
import toast from "react-hot-toast";
import axios from "axios";

// Corrected Material-UI Icon Imports
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import LinkIcon from "@mui/icons-material/Link";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";

interface SourceConfig {
  icon: JSX.Element;
  title: string;
  description: string;
  gradient: string;
  section: string;
}

interface SourceSelectionPageProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  selectedSource: string | null;
  setSelectedSource: (source: string | null) => void;
  uploadedContent: {
    type: string;
    name: string;
    size: number;
    content: string;
    url?: string;
    file?: File; // Store the raw File object
  } | null;
  setUploadedContent: (
    content: {
      type: string;
      name: string;
      size: number;
      content: string;
      url?: string;
      file?: File;
    } | null
  ) => void;
  textContent: string;
  setTextContent: (text: string) => void;
  urlContent: string;
  setUrlContent: (url: string) => void;
  error: string;
  setError: (error: string) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
}

export default function SourceSelectionPage({
  currentStep,
  setCurrentStep,
  selectedSource,
  setSelectedSource,
  uploadedContent,
  setUploadedContent,
  textContent,
  setTextContent,
  urlContent,
  setUrlContent,
  error,
  setError,
  previewUrl,
  setPreviewUrl,
}: SourceSelectionPageProps) {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const sourceConfigs: { [key: string]: SourceConfig } = {
    pdf: {
      icon: <PictureAsPdfIcon className="text-cyan-300 text-xl sm:text-2xl" />,
      title: "Upload PDF Document",
      description: "AI will extract text and create questions from your PDF",
      gradient: "from-cyan-500 to-blue-600",
      section: "pdfUpload",
    },
    image: {
      icon: <ImageIcon className="text-cyan-300 text-xl sm:text-2xl" />,
      title: "Upload Images",
      description: "AI will read text from images and generate questions",
      gradient: "from-cyan-500 to-teal-600",
      section: "imageUpload",
    },
    text: {
      icon: <TextFieldsIcon className="text-cyan-300 text-xl sm:text-2xl" />,
      title: "Enter Your Text",
      description: "Paste or type content directly for quiz generation",
      gradient: "from-cyan-500 to-indigo-600",
      section: "textInput",
    },
    url: {
      icon: <LinkIcon className="text-cyan-300 text-xl sm:text-2xl" />,
      title: "Enter Web URL",
      description: "AI will extract content from the webpage",
      gradient: "from-cyan-500 to-purple-600",
      section: "urlInput",
    },
  };

  const handleSourceSelect = (source: string) => {
    setSelectedSource(source);
    setUploadedContent(null);
    setPreviewUrl(null);
    setError("");
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (
        (type === "pdf" && file.type === "application/pdf") ||
        (type === "image" && file.type.startsWith("image/"))
      ) {
        const fileUrl = URL.createObjectURL(file);
        setUploadedContent({
          type,
          name: file.name,
          size: file.size,
          content: `Processed content from ${file.name}`,
          url: fileUrl,
          file, // Store the raw File object
        });
        toast.success(`${file.name} uploaded successfully!`);
        setError("");
      } else {
        setError(`Only ${type === "pdf" ? "PDF" : "image"} files are allowed.`);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: string) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (
        (type === "pdf" && file.type === "application/pdf") ||
        (type === "image" && file.type.startsWith("image/"))
      ) {
        const fileUrl = URL.createObjectURL(file);
        setUploadedContent({
          type,
          name: file.name,
          size: file.size,
          content: `Processed content from ${file.name}`,
          url: fileUrl,
          file,
        });
        toast.success(`${file.name} uploaded successfully!`);
        setError("");
      } else {
        setError(`Only ${type === "pdf" ? "PDF" : "image"} files are allowed.`);
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(e.target.value);
    setError("");
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setUrlContent(e.target.value);
    setError("");
  };

  const setExampleUrl = (type: string) => {
    const urls: { [key: string]: string } = {
      wikipedia: "https://en.wikipedia.org/wiki/Artificial_intelligence",
      news: "https://www.bbc.com/news/technology",
      blog: "https://blog.example.com/machine-learning-basics",
    };
    setUrlContent(urls[type]);
    setError("");
  };

  const viewUploadedFile = () => {
    if (uploadedContent?.url) {
      setPreviewUrl(uploadedContent.url);
      setIsOpen(true);
    } else {
      toast.error("No file available to preview");
      setError("No file available to preview");
    }
  };

  const nextStep = async () => {
    if (currentStep === 1 && !selectedSource) {
      setError("Please select a content source.");
      return;
    }
    let hasContent = false;
    switch (selectedSource) {
      case "text":
        hasContent = textContent.trim().length > 0;
        break;
      case "url":
        hasContent = urlContent.trim().length > 0;
        break;
      case "pdf":
      case "image":
        hasContent = uploadedContent !== null;
        break;
    }
    if (!hasContent) {
      setError("Please provide content before proceeding.");
      return;
    }

    setError("");
    setCurrentStep(currentStep + 1);
  };

  useEffect(() => {
    return () => {
      if (uploadedContent?.url) {
        URL.revokeObjectURL(uploadedContent.url);
      }
    };
  }, [uploadedContent]);

  return (
    <motion.div
      className="mb-8 sm:mb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2
        className="text-xl sm:text-2xl font-semibold text-center mb-6 sm:mb-8 text-cyan-300"
        variants={itemVariants}
      >
        Choose Your Content Source
      </motion.h2>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        variants={itemVariants}
      >
        {Object.keys(sourceConfigs).map((source) => (
          <motion.div
            key={source}
            className={`rounded-2xl p-4 sm:p-6 cursor-pointer bg-black/20 backdrop-blur-md border border-cyan-300/20 hover:bg-cyan-500/20 hover:shadow-[0_0_10px_#0ff] transition-all duration-300 ${
              selectedSource === source
                ? "border-cyan-300 shadow-[0_0_15px_#0ff] bg-cyan-300/30"
                : ""
            }`}
            onClick={() => handleSourceSelect(source)}
            whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,255,255,0.3)" }}
          >
            <div className="text-center">
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-r ${sourceConfigs[source].gradient} flex items-center justify-center`}
              >
                {sourceConfigs[source].icon}
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-cyan-300 mb-2">
                {source === "pdf"
                  ? "PDF Documents"
                  : source === "image"
                  ? "Images & Screenshots"
                  : source === "text"
                  ? "Direct Text"
                  : "Web URLs"}
              </h3>
              <p className="text-xs sm:text-sm text-cyan-100">
                {source === "pdf"
                  ? "Upload textbooks, research papers, or study materials"
                  : source === "image"
                  ? "Extract text from images, diagrams, or handwritten notes"
                  : source === "text"
                  ? "Paste or type your content directly"
                  : "Generate from articles, Wikipedia, or any webpage"}
              </p>
              <div className="mt-3 sm:mt-4 text-xs text-cyan-300">
                {source === "pdf"
                  ? "Supports: .pdf files up to 50MB"
                  : source === "image"
                  ? "Supports: JPG, PNG, WebP up to 10MB"
                  : source === "text"
                  ? "Perfect for: Articles, notes, transcripts"
                  : "Auto-extracts: Text content from URLs"}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {selectedSource && (
        <motion.div
          className="rounded-3xl p-6 sm:p-8 mt-6 sm:mt-8 bg-black/20 backdrop-blur-md border border-cyan-300/20"
          variants={containerVariants}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6"
            variants={itemVariants}
          >
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r ${sourceConfigs[selectedSource].gradient} flex items-center justify-center`}
            >
              {sourceConfigs[selectedSource].icon}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-cyan-300">
                {sourceConfigs[selectedSource].title}
              </h3>
              <p className="text-xs sm:text-sm text-cyan-100">
                {sourceConfigs[selectedSource].description}
              </p>
            </div>
          </motion.div>

          {selectedSource === "pdf" && (
            <>
              <motion.div
                className={`rounded-2xl p-6 sm:p-8 text-center border-2 border-dashed ${
                  isDragging
                    ? "border-cyan-300 bg-cyan-300/10"
                    : "border-cyan-300/30"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "pdf")}
                variants={itemVariants}
              >
                <CloudUploadIcon className="text-5xl sm:text-6xl text-cyan-300 mb-3 sm:mb-4" />
                <h4 className="text-lg sm:text-xl font-semibold text-cyan-300 mb-2">
                  Drop your PDF here
                </h4>
                <p className="text-xs sm:text-sm text-cyan-100 mb-3 sm:mb-4">
                  or click to browse files
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  ref={pdfInputRef}
                  onChange={(e) => handleFileChange(e, "pdf")}
                  className="hidden"
                />
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => pdfInputRef.current?.click()}
                    className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-4 sm:px-6 py-2 sm:py-3 rounded-md font-medium text-sm sm:text-base transition-all hover:shadow-[0_0_10px_#0ff]"
                  >
                    Choose PDF File
                  </button>
                  {uploadedContent && uploadedContent.type === "pdf" && (
                    <button
                      onClick={viewUploadedFile}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-4 sm:px-6 py-2 sm:py-3 rounded-md font-medium text-sm sm:text-base transition-all hover:shadow-[0_0_10px_#0ff] flex items-center gap-2"
                    >
                      <VisibilityIcon className="h-5 w-5" />
                      View PDF
                    </button>
                  )}
                </div>
                <div className="mt-3 sm:mt-4 text-xs text-cyan-300">
                  Maximum file size: 50MB • Supported: PDF documents
                </div>
                {uploadedContent && uploadedContent.type === "pdf" && (
                  <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-cyan-100">
                    Uploaded: {uploadedContent.name}
                  </div>
                )}
              </motion.div>
              <motion.div
                className="flex flex-col sm:flex-row justify-between mt-4 gap-3"
                variants={itemVariants}
              >
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
                >
                  <ArrowBackIcon className="mr-2 text-sm" />
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-medium text-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center"
                >
                  Continue to Basic Info
                  <ArrowForwardIcon className="ml-2 text-sm" />
                </button>
              </motion.div>
            </>
          )}

          {selectedSource === "image" && (
            <>
              <motion.div
                className={`rounded-2xl p-6 sm:p-8 text-center border-2 border-dashed ${
                  isDragging
                    ? "border-cyan-300 bg-cyan-300/10"
                    : "border-cyan-300/30"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "image")}
                variants={itemVariants}
              >
                <CloudUploadIcon className="text-5xl sm:text-6xl text-cyan-300 mb-3 sm:mb-4" />
                <h4 className="text-lg sm:text-xl font-semibold text-cyan-300 mb-2">
                  Drop your images here
                </h4>
                <p className="text-xs sm:text-sm text-cyan-100 mb-3 sm:mb-4">
                  AI will extract text and create questions
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={imageInputRef}
                  onChange={(e) => handleFileChange(e, "image")}
                  className="hidden"
                />
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-4 sm:px-6 py-2 sm:py-3 rounded-md font-medium text-sm sm:text-base transition-all hover:shadow-[0_0_10px_#0ff]"
                  >
                    Choose Images
                  </button>
                  {uploadedContent && uploadedContent.type === "image" && (
                    <button
                      onClick={viewUploadedFile}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-4 sm:px-6 py-2 sm:py-3 rounded-md font-medium text-sm sm:text-base transition-all hover:shadow-[0_0_10px_#0ff] flex items-center gap-2"
                    >
                      <VisibilityIcon className="h-5 w-5" />
                      View Image
                    </button>
                  )}
                </div>
                <div className="mt-3 sm:mt-4 text-xs text-cyan-300">
                  Maximum: 10MB per image • Supported: JPG, PNG, WebP
                </div>
                {uploadedContent && uploadedContent.type === "image" && (
                  <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-cyan-100">
                    Uploaded: {uploadedContent.name}
                  </div>
                )}
              </motion.div>
              <motion.div
                className="flex flex-col sm:flex-row justify-between mt-4 gap-3"
                variants={itemVariants}
              >
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
                >
                  <ArrowBackIcon className="mr-2 text-sm" />
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-medium text-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center"
                >
                  Continue to Basic Info
                  <ArrowForwardIcon className="ml-2 text-sm" />
                </button>
              </motion.div>
            </>
          )}

          {selectedSource === "text" && (
            <motion.div className="space-y-4" variants={itemVariants}>
              <textarea
                value={textContent}
                onChange={handleTextChange}
                rows={10}
                placeholder={`Paste your content here...\n\nExamples:\n• Course materials or lecture notes\n• Article text or research content\n• Study guides or textbook excerpts\n• Any educational content you want to turn into a quiz\n\nThe more detailed your content, the better questions AI can generate!`}
                className="w-full p-4 sm:p-6 bg-black/30 border border-cyan-300/30 rounded-2xl text-cyan-100 text-sm sm:text-base placeholder-cyan-300 focus:border-cyan-300 focus:outline-none transition-all resize-none"
              />
              <div className="flex justify-between items-center text-xs sm:text-sm text-cyan-300">
                <span>Minimum 100 characters recommended</span>
                <span>{textContent.length} characters</span>
              </div>
              <motion.div
                className="flex flex-col sm:flex-row justify-between mt-4 gap-3"
                variants={itemVariants}
              >
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
                >
                  <ArrowBackIcon className="mr-2 text-sm" />
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-medium text-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center"
                >
                  Continue to Basic Info
                  <ArrowForwardIcon className="ml-2 text-sm" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {selectedSource === "url" && (
            <motion.div
              className="space-y-4 sm:space-y-6"
              variants={itemVariants}
            >
              <div>
                <input
                  type="url"
                  value={urlContent}
                  onChange={handleUrlChange}
                  placeholder="https://example.com/article-or-page"
                  className="w-full p-3 sm:p-4 bg-black/30 border border-cyan-300/30 rounded-md text-cyan-100 text-sm sm:text-base placeholder-cyan-300 focus:border-cyan-300 focus:outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {["wikipedia", "news", "blog"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setExampleUrl(type)}
                    className="p-3 sm:p-4 bg-black/20 hover:bg-cyan-500/20 rounded-md text-left transition-all hover:shadow-[0_0_10px_#0ff]"
                  >
                    <div className="font-medium text-cyan-300 text-sm sm:text-base">
                      {type === "wikipedia"
                        ? "Wikipedia Article"
                        : type === "news"
                        ? "News Article"
                        : "Educational Blog"}
                    </div>
                    <div className="text-xs sm:text-sm text-cyan-100">
                      {type === "wikipedia"
                        ? "Educational encyclopedia content"
                        : type === "news"
                        ? "Current events and analysis"
                        : "Learning resources and tutorials"}
                    </div>
                  </button>
                ))}
              </div>
              <div className="bg-cyan-500/10 border border-cyan-300/30 rounded-md p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Close className="text-cyan-300 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-cyan-300 font-medium text-sm sm:text-base">
                    URL Processing
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-cyan-100">
                  AI will automatically extract and analyze the main content
                  from the webpage, filtering out navigation and ads.
                </p>
              </div>
              <motion.div
                className="flex flex-col sm:flex-row justify-between mt-4 gap-3"
                variants={itemVariants}
              >
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
                >
                  <ArrowBackIcon className="mr-2 text-sm" />
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-medium text-sm transition-all shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center"
                >
                  Continue to Basic Info
                  <ArrowForwardIcon className="ml-2 text-sm" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(0, 255, 255, 0.2)",
            borderRadius: "1.5rem",
            padding: "1.5rem",
            maxWidth: "80vw",
            boxShadow: "0 0 15px rgba(0, 255, 255, 0.2)",
          },
        }}
      >
        <DialogContent
          style={{
            position: "relative",
            padding: 0,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-cyan-300 hover:text-cyan-100 transition-all z-10"
          >
            <CloseIcon className="cursor-pointer" />
          </button>
          {uploadedContent?.type === "pdf" ? (
            <object
              data={previewUrl}
              type="application/pdf"
              className="w-full h-[60vh] sm:h-[80vh] rounded-md"
              title="PDF Preview"
            >
              <p className="text-cyan-100 p-4">
                Your browser does not support PDF previews.{" "}
                <a
                  href={previewUrl}
                  download={uploadedContent?.name}
                  className="text-cyan-300 underline"
                >
                  Download the PDF
                </a>{" "}
                to view it.
              </p>
            </object>
          ) : (
            <img
              src={previewUrl || ""}
              alt="Uploaded Image"
              className="w-full h-auto max-h-[80vh] rounded-md object-contain"
              onError={() => {
                toast.error("Failed to load image preview");
                setPreviewUrl(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
