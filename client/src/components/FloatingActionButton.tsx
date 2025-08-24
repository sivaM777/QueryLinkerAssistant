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
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 group"
          onClick={handleOpenSearch}
          data-testid="floating-search-button"
        >
          <Search className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
        </Button>
      </motion.div>

      <SearchModal 
        isOpen={searchModalOpen} 
        onClose={() => setSearchModalOpen(false)} 
      />
    </>
  );
}
