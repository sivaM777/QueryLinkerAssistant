import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import SearchModal from "./SearchModal";
import { motion } from "framer-motion";

export default function FloatingActionButton() {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const handleOpenSearch = () => {
    setSearchModalOpen(true);
  };

  return (
    <>
      <motion.div
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          size="lg"
          className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 group"
          onClick={handleOpenSearch}
          data-testid="floating-search-button"
          title="Open AI Search"
          aria-label="Open AI Search"
        >
          <Search className="h-5 w-5 md:h-6 md:w-6 text-white group-hover:scale-110 transition-transform" />
        </Button>
      </motion.div>

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}
