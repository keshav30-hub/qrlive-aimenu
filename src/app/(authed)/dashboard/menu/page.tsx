'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, MoreVertical, Save, Search, Sparkles, Loader2, Upload } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrency } from '@/hooks/use-currency';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateMenuItemDetails } from '@/ai/flows/generate-menu-item-details';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseStorage } from '@/firebase/storage/use-firebase-storage';
import { generateComboDescription } from '@/ai/flows/generate-combo-description';
import { cn } from '@/lib/utils';

type Addon = { name: string; price: string };
type Modifier = { name: string; price: string };

type MenuItem = {
  id: string;
  name: string;
  category: string;
  ingredients: string;
  description: string;
  mrp: string;
  kcal: string;
  duration: string;
  type: 'veg' | 'non-veg' | 'na';
  addons: Addon[];
  modifiers: Modifier[];
  available: boolean;
  imageUrl?: string;
  imageStoragePath?: string;
  serves?: string;
  tags?: string[];
};

const initialItemState: Omit<MenuItem, 'id'> = {
  name: '',
  category: '',
  ingredients: '',
  description: '',
  mrp: '',
  kcal: '',
  duration: '',
  type: 'veg',
  addons: [{ name: '', price: '' }],
  modifiers: [{ name: '', price: '' }],
  available: true,
  serves: '',
  tags: [],
};


const daysOfWeek = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' },
];

const foodTags = [
    { id: 'vegan', label: 'Vegan' },
    { id: 'gluten-free', label: 'Gluten Free' },
    { id: 'dairy-free', label: 'Dairy Free' },
    { id: 'spicy', label: 'Spicy' },
];

type Category = {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    imageStoragePath?: string;
    imageHint: string;
    isAvailable: boolean;
    availability: {
      days: string[];
      startTime: string;
      endTime: string;
    };
};

const defaultCategory: Omit<Category, 'id' | 'imageUrl' | 'imageHint'> = {
    name: '',
    description: '',
    isAvailable: true,
    availability: {
        days: [],
        startTime: '',
        endTime: '',
    },
};

type Combo = {
  id: string;
  name: string;
  items: string[];
  price: string;
  description?: string;
  available: boolean;
  imageUrl?: string;
  imageStoragePath?: string;
  serves?: string;
  tags?: string[];
}

const initialComboState: Partial<Combo> = {
  name: '',
  items: [],
  price: '',
  description: '',
  available: true,
  imageUrl: '',
  imageStoragePath: '',
  serves: '',
  tags: [],
}

const ITEMS_PER_PAGE = 15;

export default function MenuPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const { uploadFile, deleteFile, isLoading: isUploading } = useFirebaseStorage();

  const categoriesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'menuCategories') : null, [firestore, user]);
  const menuItemsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'menuItems') : null, [firestore, user]);
  const combosRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'combos') : null, [firestore, user]);

  const { data: categoriesData, isLoading: categoriesLoading } = useCollection<Category>(categoriesRef);
  const { data: itemsData, isLoading: itemsLoading } = useCollection<MenuItem>(menuItemsRef);
  const { data: combosData, isLoading: combosLoading } = useCollection<Combo>(combosRef);

  const categories = categoriesData || [];
  const items = itemsData || [];
  const combos = combosData || [];

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isComboDialogOpen, setIsComboDialogOpen] = useState(false);
  const [isEditingCombo, setIsEditingCombo] = useState(false);
  
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>(initialItemState);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>(defaultCategory);
  const [currentCombo, setCurrentCombo] = useState<Partial<Combo>>(initialComboState);

  // State for Combo Dialog
  const [comboSearchTerm, setComboSearchTerm] = useState('');


  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingCombo, setIsSavingCombo] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemSearch, setItemSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [comboToDelete, setComboToDelete] = useState<Combo | null>(null);

  const { format } = useCurrency();
  
  const handleGenerateDetails = async () => {
    if (!currentItem.name || !currentItem.ingredients || !currentItem.type) return;
    setIsGenerating(true);
    try {
      const result = await generateMenuItemDetails({
        itemName: currentItem.name,
        ingredients: currentItem.ingredients,
        type: currentItem.type,
      });
      setCurrentItem(prev => ({
        ...prev,
        description: result.description,
        kcal: result.kcal.toString(),
      }));
    } catch (error) {
      console.error('Failed to generate menu item details:', error);
      toast({ variant: "destructive", title: "AI Generation Failed", description: "Could not generate item details." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateComboDescription = async () => {
    if (!currentCombo.name || !currentCombo.price || !currentCombo.items || currentCombo.items.length === 0) {
      toast({ variant: 'destructive', title: 'Missing Info', description: 'Please provide combo name, price, and select items.' });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateComboDescription({
        comboName: currentCombo.name,
        items: currentCombo.items,
        price: currentCombo.price,
      });
      setCurrentCombo(prev => ({...prev, description: result.description}));
    } catch(e) {
       toast({ variant: "destructive", title: "AI Generation Failed", description: "Could not generate combo description." });
    } finally {
      setIsGenerating(false);
    }
  }

  const filteredComboItems = items.filter(item => item.name.toLowerCase().includes(comboSearchTerm.toLowerCase()));

  const handleItemCheckboxChange = (itemName: string, checked: boolean) => {
    setCurrentCombo(prev => {
        const currentItems = prev.items || [];
        const newItems = checked ? [...currentItems, itemName] : currentItems.filter(name => name !== itemName);
        return {...prev, items: newItems };
    });
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioChange = (value: string) => {
    setCurrentItem(prev => ({ ...prev, type: value as 'veg' | 'non-veg' | 'na' }));
  };
  
  const handleCategorySelectChange = (value: string) => {
    setCurrentItem(prev => ({...prev, category: value }));
  }

  const handleAddonChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const addons = [...(currentItem.addons || [])];
    addons[index] = { ...addons[index], [name]: value };
    setCurrentItem(prev => ({ ...prev, addons }));
  };

  const handleModifierChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const modifiers = [...(currentItem.modifiers || [])];
    modifiers[index] = { ...modifiers[index], [name]: value };
    setCurrentItem(prev => ({ ...prev, modifiers }));
  };

  const addAddonField = () => {
    setCurrentItem(prev => ({ ...prev, addons: [...(prev.addons || []), { name: '', price: '' }] }));
  };

  const addModifierField = () => {
    setCurrentItem(prev => ({ ...prev, modifiers: [...(prev.modifiers || []), { name: '', price: '' }] }));
  };
  
  const removeAddonField = (index: number) => {
    const addons = [...(currentItem.addons || [])];
    addons.splice(index, 1);
    setCurrentItem(prev => ({ ...prev, addons }));
  };

  const removeModifierField = (index: number) => {
    const modifiers = [...(currentItem.modifiers || [])];
    modifiers.splice(index, 1);
    setCurrentItem(prev => ({ ...prev, modifiers }));
  };

  const handleTagToggle = (tagId: string) => {
    setCurrentItem(prev => {
        const currentTags = prev.tags || [];
        const newTags = currentTags.includes(tagId) 
            ? currentTags.filter(t => t !== tagId) 
            : [...currentTags, tagId];
        return { ...prev, tags: newTags };
    });
  };
  
  const handleComboTagToggle = (tagId: string) => {
    setCurrentCombo(prev => {
        const currentTags = prev.tags || [];
        const newTags = currentTags.includes(tagId) 
            ? currentTags.filter(t => t !== tagId) 
            : [...currentTags, tagId];
        return { ...prev, tags: newTags };
    });
  };

  const handleItemImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
        const file = e.target.files[0];
        const newPath = `users/${user.uid}/images/menu-items/${Date.now()}_${file.name}`;
        const uploadResult = await uploadFile(newPath, file);
        if (uploadResult) {
            if (isEditingItem && currentItem.imageStoragePath) {
                await deleteFile(currentItem.imageStoragePath);
            }
            setCurrentItem(prev => ({
                ...prev,
                imageUrl: uploadResult.downloadURL,
                imageStoragePath: uploadResult.storagePath,
            }));
            toast({ title: 'Image Uploaded' });
        } else {
            toast({ variant: 'destructive', title: 'Upload Failed' });
        }
    }
  };

  const handleSaveItem = async () => {
    if (!menuItemsRef || !currentItem.category) {
        toast({ variant: "destructive", title: "Missing Category", description: "Please select a category for the item." });
        return;
    }
    setIsSavingItem(true);
    try {
        const itemData = {
          ...currentItem,
          imageUrl: currentItem.imageUrl || `https://picsum.photos/seed/item${Date.now()}/400/300`,
        };

        if (isEditingItem && currentItem.id) {
            const itemDoc = doc(menuItemsRef, currentItem.id);
            await updateDoc(itemDoc, { ...itemData, updatedAt: serverTimestamp() });
            toast({ title: "Success", description: "Menu item updated." });
        } else {
            await addDoc(menuItemsRef, { ...itemData, createdAt: serverTimestamp() });
            toast({ title: "Success", description: "Menu item added." });
        }
        setIsSheetOpen(false);
    } catch(e) {
        toast({ variant: "destructive", title: "Error", description: "Could not save menu item." });
        console.error(e);
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!menuItemsRef) return;
    try {
        if(item.imageStoragePath) {
            await deleteFile(item.imageStoragePath);
        }
        await deleteDoc(doc(menuItemsRef, item.id));
        toast({ title: "Success", description: "Menu item deleted." });
    } catch(e) {
        toast({ variant: "destructive", title: "Error", description: "Could not delete menu item." });
        console.error(e);
    }
  };


  const handleEditItemClick = (item: MenuItem) => {
    setIsEditingItem(true);
    setCurrentItem(item);
    setIsSheetOpen(true);
  };

  const handleAddItemClick = () => {
    setIsEditingItem(false);
    setCurrentItem(initialItemState);
    setIsSheetOpen(true);
  };

  const handleItemAvailabilityToggle = async (itemId: string, available: boolean) => {
    if (!menuItemsRef) return;
    const itemDoc = doc(menuItemsRef, itemId);
    try {
        await updateDoc(itemDoc, { available });
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not update availability." });
        console.error(e);
    }
  };


  const handleEditCategoryClick = (category: Category) => {
    setIsEditingCategory(true);
    setCurrentCategory(category);
    setIsCategorySheetOpen(true);
  };

  const handleCategoryToggleSwitch = async (categoryId: string, isAvailable: boolean) => {
    if (!categoriesRef) return;
    const catDoc = doc(categoriesRef, categoryId);
    try {
        await updateDoc(catDoc, { isAvailable });
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not update category status." });
        console.error(e);
    }
  };
  
  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id === 'startTime' || id === 'endTime') {
        setCurrentCategory(prev => ({ 
            ...prev, 
            availability: { ...(prev.availability || { days: [], startTime: '', endTime: '' }), [id]: value } 
        }));
    } else {
        setCurrentCategory(prev => ({ ...prev, [id]: value }));
    }
};

const handleCategoryDayChange = (dayId: string, checked: boolean) => {
    const currentDays = currentCategory.availability?.days || [];
    const newDays = checked ? [...currentDays, dayId] : currentDays.filter(d => d !== dayId);
    setCurrentCategory(prev => ({
        ...prev,
        availability: { ...(prev.availability || { days: [], startTime: '', endTime: '' }), days: newDays }
    }));
}

  const handleCategoryImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0] && user) {
        const file = e.target.files[0];
        const newPath = `users/${user.uid}/images/categories/${Date.now()}_${file.name}`;
        const uploadResult = await uploadFile(newPath, file);

        if (uploadResult) {
            if (isEditingCategory && currentCategory.imageStoragePath) {
                await deleteFile(currentCategory.imageStoragePath);
            }
            setCurrentCategory(prev => ({
                ...prev,
                imageUrl: uploadResult.downloadURL,
                imageStoragePath: uploadResult.storagePath,
                imageHint: 'user uploaded',
            }));
            toast({ title: 'Image Uploaded' });
        } else {
            toast({ variant: 'destructive', title: 'Upload Failed' });
        }
    }
  };

  const handleSaveCategory = async () => {
    if (!categoriesRef) return;
    setIsSavingCategory(true);
    try {
        const categoryData = {
          ...currentCategory,
          imageUrl: currentCategory.imageUrl || `https://picsum.photos/seed/cat${Date.now()}/600/400`,
          imageHint: currentCategory.imageHint || 'new category',
        };

        if (isEditingCategory && currentCategory.id) {
            const catDoc = doc(categoriesRef, currentCategory.id);
            await updateDoc(catDoc, { ...categoryData, updatedAt: serverTimestamp() });
            toast({ title: "Success", description: "Category updated." });
        } else {
             await addDoc(categoriesRef, { 
                ...categoryData,
                createdAt: serverTimestamp() 
            });
            toast({ title: "Success", description: "Category added." });
        }
        setIsCategorySheetOpen(false);
        setCurrentCategory(defaultCategory);
    } catch(e) {
        toast({ variant: "destructive", title: "Error", description: "Could not save category." });
        console.error(e);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!categoriesRef) return;
    try {
        if(category.imageStoragePath) {
            await deleteFile(category.imageStoragePath);
        }
        await deleteDoc(doc(categoriesRef, category.id));
        toast({ title: "Success", description: "Category deleted." });
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not delete category." });
        console.error(e);
    }
  };

  const handleComboImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
        const file = e.target.files[0];
        const newPath = `users/${user.uid}/images/combos/${Date.now()}_${file.name}`;
        const uploadResult = await uploadFile(newPath, file);
        if (uploadResult) {
            if (isEditingCombo && currentCombo.imageStoragePath) {
                await deleteFile(currentCombo.imageStoragePath);
            }
            setCurrentCombo(prev => ({
                ...prev,
                imageUrl: uploadResult.downloadURL,
                imageStoragePath: uploadResult.storagePath,
            }));
            toast({ title: 'Image Uploaded' });
        } else {
            toast({ variant: 'destructive', title: 'Upload Failed' });
        }
    }
  };

  const handleSaveCombo = async () => {
    if (!combosRef || !currentCombo.name || !currentCombo.price || !currentCombo.items || currentCombo.items.length === 0) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide a name, price, and select items for the combo." });
      return;
    }
    
    setIsSavingCombo(true);
    try {
        const comboData = {
            name: currentCombo.name,
            price: currentCombo.price,
            description: currentCombo.description,
            items: currentCombo.items,
            available: currentCombo.id ? currentCombo.available : true,
            imageUrl: currentCombo.imageUrl || `https://picsum.photos/seed/combo${Date.now()}/400/300`,
            imageStoragePath: currentCombo.imageStoragePath,
            serves: currentCombo.serves,
            tags: currentCombo.tags || [],
        };

        if (isEditingCombo && currentCombo.id) {
            await updateDoc(doc(combosRef, currentCombo.id), comboData);
            toast({ title: "Success", description: "Combo updated." });
        } else {
            await addDoc(combosRef, { ...comboData, createdAt: serverTimestamp() });
            toast({ title: "Success", description: "Combo added." });
        }
        
        setIsComboDialogOpen(false);
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not save combo." });
        console.error(e);
    } finally {
      setIsSavingCombo(false);
    }
  };


  const handleDeleteCombo = async () => {
    if (!combosRef || !comboToDelete) return;
    try {
        if(comboToDelete.imageStoragePath) {
          await deleteFile(comboToDelete.imageStoragePath);
        }
        await deleteDoc(doc(combosRef, comboToDelete.id));
        toast({ title: "Success", description: "Combo deleted." });
        setComboToDelete(null);
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not delete combo." });
        console.error(e);
    }
  };

  const handleComboAvailabilityToggle = async (comboId: string, available: boolean) => {
    if (!combosRef) return;
    try {
        await updateDoc(doc(combosRef, comboId), { available });
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not update combo availability." });
        console.error(e);
    }
  };
  
  const handleAddComboClick = () => {
    setIsEditingCombo(false);
    setCurrentCombo(initialComboState);
    setIsComboDialogOpen(true);
  };
  
  const handleEditComboClick = (combo: Combo) => {
    setIsEditingCombo(true);
    setCurrentCombo(combo);
    setIsComboDialogOpen(true);
  };

  const filteredItems = items
    .filter(item => item.name.toLowerCase().includes(itemSearch.toLowerCase()))
    .filter(item => filterCategory === 'all' || item.category === filterCategory)
    .filter(item => filterType === 'all' || item.type === filterType);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Menu Management</h1>
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="category">Category</TabsTrigger>
          <TabsTrigger value="combo">Combo</TabsTrigger>
        </TabsList>
        <TabsContent value="items">
          <div className="flex justify-end">
             <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button onClick={handleAddItemClick}>
                  <PlusCircle className="mr-2" /> Add Item
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>{isEditingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</SheetTitle>
                  <SheetDescription>
                    Fill in the details below to add a new item to your menu.
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100%-120px)] pr-4">
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-image">Item Image</Label>
                      {currentItem.imageUrl && (
                          <div className="relative w-full h-40 rounded-md overflow-hidden">
                              <Image src={currentItem.imageUrl} alt={currentItem.name || "Item Image"} fill style={{objectFit: 'cover'}} />
                          </div>
                      )}
                      <Input id="item-image" type="file" onChange={handleItemImageChange} disabled={isUploading}/>
                      {isUploading && <p className="text-sm text-muted-foreground">Uploading image...</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Item Name</Label>
                      <Input id="name" name="name" value={currentItem.name} onChange={handleInputChange} placeholder="e.g. Classic Burger" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select onValueChange={handleCategorySelectChange} value={currentItem.category}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categoriesLoading ? (
                                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                                ) : (
                                    categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                      <Label>Type</Label>
                       <RadioGroup
                        defaultValue="veg"
                        className="flex gap-4"
                        onValueChange={handleRadioChange}
                        value={currentItem.type}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="veg" id="veg" />
                          <Label htmlFor="veg" className="font-normal">Veg</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="non-veg" id="non-veg" />
                          <Label htmlFor="non-veg" className="font-normal">Non-Veg</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="na" id="na" />
                          <Label htmlFor="na" className="font-normal">N/A</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label>Food Tags (Optional)</Label>
                        <div className="flex flex-wrap gap-2">
                            {foodTags.map(tag => (
                                <Button
                                    key={tag.id}
                                    type="button"
                                    variant={(currentItem.tags || []).includes(tag.id) ? 'default' : 'outline'}
                                    onClick={() => handleTagToggle(tag.id)}
                                >
                                    {tag.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ingredients">Ingredients</Label>
                      <Textarea id="ingredients" name="ingredients" value={currentItem.ingredients} onChange={handleInputChange} placeholder="e.g. Patty, Lettuce, Tomato, Cheese" />
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                         <Label htmlFor="description">Description</Label>
                         <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateDetails}
                            disabled={isGenerating || !currentItem.name || !currentItem.ingredients || !currentItem.type}
                          >
                           <Sparkles className="mr-2 h-4 w-4" />
                           {isGenerating ? 'Generating...' : 'Generate'}
                         </Button>
                       </div>
                       <p className="text-xs text-muted-foreground">
                          Fill in name, type, and ingredients to enable AI-powered generation for description and kcal.
                       </p>
                      <Textarea id="description" name="description" value={currentItem.description} onChange={handleInputChange} placeholder="Describe the item..." />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="mrp">MRP ({format(0).substring(0,1)})</Label>
                            <Input id="mrp" name="mrp" type="number" value={currentItem.mrp} onChange={handleInputChange} placeholder="e.g. 150" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="kcal">Kcal</Label>
                            <Input id="kcal" name="kcal" type="number" value={currentItem.kcal} onChange={handleInputChange} placeholder="e.g. 500" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                             <Label htmlFor="duration">Preparation Duration (in mins)</Label>
                             <Input id="duration" name="duration" type="number" value={currentItem.duration} onChange={handleInputChange} placeholder="e.g. 15" />
                         </div>
                         <div className="space-y-2">
                            <Label htmlFor="serves">Serves (Optional)</Label>
                            <Input id="serves" name="serves" value={currentItem.serves} onChange={handleInputChange} placeholder="e.g., 2 or 2-3 people" />
                         </div>
                     </div>
                    <Accordion type="multiple" className="w-full">
                      <AccordionItem value="add-ons">
                        <AccordionTrigger>Add-ons</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {(currentItem.addons || []).map((addon, index) => (
                            <div key={index} className="flex gap-2 items-end">
                              <div className="grid w-full gap-2">
                                <Label htmlFor={`addon-name-${index}`}>Name</Label>
                                <Input id={`addon-name-${index}`} name="name" value={addon.name} onChange={(e) => handleAddonChange(index, e)} placeholder="e.g. Extra Cheese" />
                              </div>
                              <div className="grid w-full gap-2">
                                <Label htmlFor={`addon-price-${index}`}>Price</Label>
                                <Input id={`addon-price-${index}`} name="price" type="number" value={addon.price} onChange={(e) => handleAddonChange(index, e)} placeholder="e.g. 30" />
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeAddonField(index)} disabled={(currentItem.addons || []).length === 1}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={addAddonField} className="mt-2">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Field
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="modifiers">
                        <AccordionTrigger>Modifiers</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {(currentItem.modifiers || []).map((modifier, index) => (
                            <div key={index} className="flex gap-2 items-end">
                              <div className="grid w-full gap-2">
                                <Label htmlFor={`modifier-name-${index}`}>Name</Label>
                                <Input id={`modifier-name-${index}`} name="name" value={modifier.name} onChange={(e) => handleModifierChange(index, e)} placeholder="e.g. Small" />
                              </div>
                              <div className="grid w-full gap-2">
                                <Label htmlFor={`modifier-price-${index}`}>Price</Label>
                                <Input id={`modifier-price-${index}`} name="price" type="number" value={modifier.price} onChange={(e) => handleModifierChange(index, e)} placeholder="e.g. 90" />
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeModifierField(index)} disabled={(currentItem.modifiers || []).length === 1}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={addModifierField} className="mt-2">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Field
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </ScrollArea>
                <SheetFooter>
                  <Button variant="outline" onClick={() => setIsSheetOpen(false)} disabled={isSavingItem || isUploading}>Cancel</Button>
                  <Button onClick={handleSaveItem} disabled={isSavingItem || isUploading}>
                    {isSavingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    {isSavingItem ? 'Saving...' : isEditingItem ? 'Save Changes' : 'Save Item'}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
          <Card className="mt-4">
            <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by item name..." 
                            className="pl-10"
                            value={itemSearch}
                            onChange={(e) => setItemSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories && categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="veg">Veg</SelectItem>
                                <SelectItem value="non-veg">Non-Veg</SelectItem>
                                <SelectItem value="na">N/A</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>MRP</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Availability</TableHead>
                                <TableHead className="text-right">More</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {itemsLoading ? (
                                <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
                            ) : paginatedItems.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>{format(Number(item.mrp))}</TableCell>
                                    <TableCell className="capitalize">{item.type}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={item.available}
                                            onCheckedChange={(checked) => handleItemAvailabilityToggle(item.id, checked)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditItemClick(item)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteItem(item)}>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 {filteredItems.length === 0 && !itemsLoading && (
                    <div className="mt-4 text-center text-muted-foreground">
                        <p>No items have been added yet.</p>
                    </div>
                )}
                 <div className="flex items-center justify-end space-x-2 pt-4">
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    >
                    Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                    </span>
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    >
                    Next
                    </Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="category">
           <div className="flex justify-end mb-4">
             <Sheet open={isCategorySheetOpen} onOpenChange={setIsCategorySheetOpen}>
                <SheetTrigger asChild>
                   <Button onClick={() => { setIsEditingCategory(false); setCurrentCategory(defaultCategory); setIsCategorySheetOpen(true);}}>
                    <PlusCircle className="mr-2" /> Add Category
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader>
                    <SheetTitle>{isEditingCategory ? 'Edit Category' : 'Add New Category'}</SheetTitle>
                    <SheetDescription>
                        {isEditingCategory ? 'Update the details for your menu category.' : 'Fill in the details for your new menu category.'}
                    </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100%-120px)] pr-4">
                        <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-image-edit">Category Image</Label>
                            {currentCategory.imageUrl && (
                                <div className="relative w-full h-40 rounded-md overflow-hidden">
                                    <Image src={currentCategory.imageUrl} alt={currentCategory.name || "Category Image"} fill style={{objectFit: 'cover'}} />
                                </div>
                            )}
                            <Input id="category-image-edit" type="file" onChange={handleCategoryImageChange} disabled={isUploading} />
                            {isUploading && <p className="text-sm text-muted-foreground">Uploading image...</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Category Name</Label>
                            <Input id="name" value={currentCategory.name || ''} onChange={handleCategoryInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea id="description" value={currentCategory.description || ''} onChange={handleCategoryInputChange} />
                        </div>
                        <div className="space-y-3">
                            <Label>Available Days of Week</Label>
                            <div className="grid grid-cols-3 gap-2 rounded-md border p-4">
                                {daysOfWeek.map((day) => (
                                    <div key={day.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`edit-${day.id}`}
                                            checked={(currentCategory.availability?.days || []).includes(day.id)}
                                            onCheckedChange={(checked) => handleCategoryDayChange(day.id, !!checked)}
                                        />
                                        <Label htmlFor={`edit-${day.id}`} className="font-normal text-sm">{day.label}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Available Duration</Label>
                            <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="startTime" className="text-xs">From</Label>
                                <Input id="startTime" type="time" value={currentCategory.availability?.startTime || ''} onChange={handleCategoryInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="endTime" className="text-xs">To</Label>
                                <Input id="endTime" type="time" value={currentCategory.availability?.endTime || ''} onChange={handleCategoryInputChange} />
                            </div>
                            </div>
                        </div>
                        </div>
                    </ScrollArea>
                    <SheetFooter>
                    <Button variant="outline" onClick={() => setIsCategorySheetOpen(false)} disabled={isSavingCategory || isUploading}>Cancel</Button>
                    <Button onClick={handleSaveCategory} disabled={isSavingCategory || isUploading}>
                        {isSavingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        {isSavingCategory ? 'Saving...' : isEditingCategory ? 'Save Changes' : 'Save Category'}
                    </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoriesLoading ? <p>Loading categories...</p> : categories.map((category) => (
                <Card key={category.id} className="overflow-hidden flex flex-col">
                    <div className="relative w-full h-40">
                        <Image
                            src={category.imageUrl || `https://picsum.photos/seed/${category.id}/600/400`}
                            alt={category.name}
                            fill
                            style={{objectFit: 'cover'}}
                            data-ai-hint={category.imageHint}
                        />
                    </div>
                    <CardHeader>
                        <CardTitle>{category.name}</CardTitle>
                    </CardHeader>
                    <CardFooter className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 mt-auto">
                        <div className="flex items-center gap-2">
                            <Switch
                                id={`category-toggle-${category.id}`}
                                checked={category.isAvailable}
                                onCheckedChange={(checked) => handleCategoryToggleSwitch(category.id, checked)}
                            />
                            <label htmlFor={`category-toggle-${category.id}`} className="text-sm font-medium">
                                {category.isAvailable ? 'Active' : 'Inactive'}
                            </label>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5" />
                                <span className="sr-only">More options</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCategoryClick(category)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(category)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardFooter>
                </Card>
                ))}
            </div>
            {(!categories || categories.length === 0) && !categoriesLoading && (
                 <div className="mt-4 text-center text-muted-foreground">
                    <p>No categories have been added yet.</p>
                </div>
            )}
        </TabsContent>
        <TabsContent value="combo">
            <div className="flex justify-end">
                <Dialog open={isComboDialogOpen} onOpenChange={setIsComboDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleAddComboClick}>
                            <PlusCircle className="mr-2" /> Add Combo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                        <DialogTitle>{isEditingCombo ? 'Edit Combo' : 'Create New Combo'}</DialogTitle>
                        <DialogDescription>
                            Bundle items together to create an attractive offer.
                        </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[70vh] pr-4">
                          <div className="grid gap-6 py-4">
                              <div className="space-y-2">
                                  <Label htmlFor="combo-image">Combo Image</Label>
                                  {currentCombo.imageUrl && (
                                      <div className="relative w-full h-40 rounded-md overflow-hidden">
                                          <Image src={currentCombo.imageUrl} alt={currentCombo.name || "Combo Image"} fill style={{objectFit: 'cover'}} />
                                      </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Input id="combo-image" type="file" onChange={handleComboImageChange} disabled={isUploading}/>
                                    {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <Label htmlFor="combo-name">Combo Name</Label>
                                      <Input id="combo-name" placeholder="e.g. Super Saver Combo" value={currentCombo.name} onChange={e => setCurrentCombo(p => ({...p, name: e.target.value}))} />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="combo-price">Price ({format(0).substring(0,1)})</Label>
                                      <Input id="combo-price" type="number" placeholder="e.g. 299" value={currentCombo.price} onChange={e => setCurrentCombo(p => ({...p, price: e.target.value}))} />
                                  </div>
                              </div>
                               <div className="space-y-2">
                                    <Label htmlFor="serves">Serves (Optional)</Label>
                                    <Input id="serves" name="serves" value={currentCombo.serves} onChange={e => setCurrentCombo(p => ({...p, serves: e.target.value}))} placeholder="e.g., 2 or 2-3 people" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Food Tags (Optional)</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {foodTags.map(tag => (
                                            <Button
                                                key={tag.id}
                                                type="button"
                                                variant={(currentCombo.tags || []).includes(tag.id) ? 'default' : 'outline'}
                                                onClick={() => handleComboTagToggle(tag.id)}
                                            >
                                                {tag.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                              <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                      <Label htmlFor="combo-description">Description</Label>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGenerateComboDescription}
                                        disabled={isGenerating || !currentCombo.name || !currentCombo.price || !currentCombo.items || currentCombo.items.length === 0}
                                      >
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        {isGenerating ? 'Generating...' : 'Generate'}
                                      </Button>
                                  </div>
                                  <Textarea id="combo-description" placeholder="Describe the combo offer..." value={currentCombo.description} onChange={e => setCurrentCombo(p => ({...p, description: e.target.value}))} />
                              </div>
                              <div className="space-y-4">
                                  <Label>Select Items</Label>
                                  <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input 
                                          placeholder="Search for items..." 
                                          className="pl-10"
                                          value={comboSearchTerm}
                                          onChange={(e) => setComboSearchTerm(e.target.value)}
                                      />
                                  </div>
                                  <ScrollArea className="h-48 rounded-md border">
                                      <div className="p-4">
                                          {filteredComboItems.length > 0 ? filteredComboItems.map(item => (
                                              <div key={item.id} className="flex items-center space-x-2 py-2">
                                                  <Checkbox 
                                                      id={`item-${item.id}`}
                                                      onCheckedChange={(checked) => handleItemCheckboxChange(item.name, !!checked)}
                                                      checked={(currentCombo.items || []).includes(item.name)}
                                                  />
                                                  <Label htmlFor={`item-${item.id}`} className="flex-1 font-normal cursor-pointer">
                                                      {item.name}
                                                  </Label>
                                              </div>
                                          )) : (
                                              <p className="text-center text-sm text-muted-foreground">No items found.</p>
                                          )}
                                      </div>
                                  </ScrollArea>
                              </div>
                          </div>
                        </ScrollArea>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsComboDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveCombo} disabled={isSavingCombo || isUploading}>
                                {isSavingCombo ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Save Combo'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <Card className="mt-4">
              <CardContent className="pt-6">
                <AlertDialog>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Combo Name</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Availability</TableHead>
                        <TableHead className="text-right">More</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {combosLoading ? <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow> : combos.map((combo, index) => (
                        <TableRow key={combo.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{combo.name}</TableCell>
                            <TableCell>
                            <div className="flex flex-wrap gap-1">
                                {combo.items.map((item, itemIndex) => (
                                <Badge key={itemIndex} variant="secondary">{item}</Badge>
                                ))}
                            </div>
                            </TableCell>
                            <TableCell>{format(Number(combo.price))}</TableCell>
                            <TableCell>
                            <Switch
                                checked={combo.available}
                                onCheckedChange={(checked) => handleComboAvailabilityToggle(combo.id, checked)}
                            />
                            </TableCell>
                            <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditComboClick(combo)}>Edit</DropdownMenuItem>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive" onClick={() => setComboToDelete(combo)}>Delete</DropdownMenuItem>
                                </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the combo "{comboToDelete?.name}".
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setComboToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteCombo} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
