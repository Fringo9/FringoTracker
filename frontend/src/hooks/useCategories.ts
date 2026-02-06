import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

const BASE_CATEGORIES = [
  "Liquidi",
  "Banca",
  "Credito",
  "Investimenti",
  "Portafoglio",
  "Debito",
  "Finanziamento",
  "Condivise",
];

export interface CategoryDefinition {
  id: string;
  name: string;
  categoryType: string;
  sortOrder: number;
  userId?: string;
}

async function fetchCategories(): Promise<CategoryDefinition[]> {
  const response = await api.get("/category-definitions");
  let categories: CategoryDefinition[] = response.data || [];

  // Seed defaults if the user has no categories yet
  if (categories.length === 0) {
    const defaults = BASE_CATEGORIES.map((name, index) => ({
      name,
      categoryType: name,
      sortOrder: index,
    }));
    await api.post("/category-definitions/bulk", defaults);
    const seededResponse = await api.get("/category-definitions");
    categories = seededResponse.data || [];
  }

  return categories;
}

export function useCategories() {
  const queryClient = useQueryClient();

  const {
    data: categoryDefinitions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["categoryDefinitions"],
    queryFn: fetchCategories,
    staleTime: 300_000, // 5 minutes
  });

  // Derive the simple string list for backward compatibility
  const categories = categoryDefinitions.map((c) => c.name);

  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const maxSort =
        categoryDefinitions.length > 0
          ? Math.max(...categoryDefinitions.map((c) => c.sortOrder)) + 1
          : 0;
      await api.post("/category-definitions/bulk", [
        { name, categoryType: name, sortOrder: maxSort },
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categoryDefinitions"] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      await api.delete(`/category-definitions/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categoryDefinitions"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; sortOrder: number }[]) => {
      await api.post("/category-definitions/reorder", items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categoryDefinitions"] });
    },
  });

  return {
    categories,
    categoryDefinitions,
    isLoading,
    error,
    addCategory: addCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    reorderCategories: reorderMutation.mutateAsync,
    isAdding: addCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,
  };
}
