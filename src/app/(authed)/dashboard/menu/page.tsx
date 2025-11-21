
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
import { PlusCircle, Trash2, MoreVertical, Save, Search, Sparkles } from 'lucide-react';
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
  type: 'veg' | 'non-veg';
  addons: Addon[];
  modifiers: Modifier[];
  available: boolean;
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

type Category = {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    imageHint: string;
    active: boolean;
    availableDays: string[];
    fromTime: string;
    toTime: string;
};

const defaultCategory: Omit<Category, 'id' | 'imageUrl' | 'imageHint'> = {
    name: '',
    description: '',
    active: true,
    availableDays: [],
    fromTime: '',
    toTime: '',
};

type Combo = {
  id: string;
  name: string;
  items: string[];
  price: string;
  available: boolean;
}

const ITEMS_PER_PAGE = 15;

export default function MenuPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  // Firestore hooks
  const categoriesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'menuCategories') : null, [firestore, user]);
  const menuItemsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'menuItems') : null, [firestore, user]);
  const combosRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'combos') : null, [firestore, user]);

  const { data: categories = [], isLoading: categoriesLoading } = useCollection<Category>(categoriesRef);
  const { data: items = [], isLoading: itemsLoading } = useCollection<MenuItem>(menuItemsRef);
  const { data: combos = [], isLoading: combosLoading } = useCollection<Combo>(combosRef);


  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>(initialItemState);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>(defaultCategory);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemSearch, setItemSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const filteredComboItems = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleItemCheckboxChange = (itemName: string, checked: boolean) => {
    setSelectedItems(prev => 
      checked ? [...prev, itemName] : prev.filter(name => name !== itemName)
    );
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioChange = (value: string) => {
    setCurrentItem(prev => ({ ...prev, type: value as 'veg' | 'non-veg' }));
  };

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

  const handleSaveItem = async () => {
    if (!menuItemsRef) return;
    try {
        if (isEditingItem && currentItem.id) {
            const itemDoc = doc(menuItemsRef, currentItem.id);
            await updateDoc(itemDoc, { ...currentItem, updatedAt: serverTimestamp() });
            toast({ title: "Success", description: "Menu item updated." });
        } else {
            await addDoc(menuItemsRef, { ...currentItem, createdAt: serverTimestamp() });
            toast({ title: "Success", description: "Menu item added." });
        }
        setIsSheetOpen(false);
    } catch(e) {
        toast({ variant: "destructive", title: "Error", description: "Could not save menu item." });
        console.error(e);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!menuItemsRef) return;
    try {
        const itemDoc = doc(menuItemsRef, itemId);
        await deleteDoc(itemDoc);
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

  const handleCategoryToggleSwitch = async (categoryId: string, active: boolean) => {
    if (!categoriesRef) return;
    const catDoc = doc(categoriesRef, categoryId);
    try {
        await updateDoc(catDoc, { active });
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not update category status." });
        console.error(e);
    }
  };
  
  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setCurrentCategory(prev => ({ ...prev, [id]: value }));
  };

  const handleCategoryDayChange = (dayId: string, checked: boolean) => {
    const currentDays = currentCategory.availableDays || [];
    const newDays = checked ? [...currentDays, dayId] : currentDays.filter(d => d !== dayId);
    setCurrentCategory(prev => ({ ...prev, availableDays: newDays }));
  }

  const handleSaveCategory = async () => {
    if (!categoriesRef) return;
    try {
        if (isEditingCategory && currentCategory.id) {
            const catDoc = doc(categoriesRef, currentCategory.id);
            await updateDoc(catDoc, { ...currentCategory, updatedAt: serverTimestamp() });
            toast({ title: "Success", description: "Category updated." });
        } else {
             await addDoc(categoriesRef, { 
                ...currentCategory,
                imageUrl: `https://picsum.photos/seed/cat${categories.length + 1}/600/400`,
                imageHint: 'new category',
                createdAt: serverTimestamp() 
            });
            toast({ title: "Success", description: "Category added." });
        }
        setIsCategorySheetOpen(false);
        setCurrentCategory(defaultCategory);
    } catch(e) {
        toast({ variant: "destructive", title: "Error", description: "Could not save category." });
        console.error(e);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!categoriesRef) return;
    try {
        await deleteDoc(doc(categoriesRef, categoryId));
        toast({ title: "Success", description: "Category deleted." });
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not delete category." });
        console.error(e);
    }
  };

  const handleSaveCombo = async (comboData: Omit<Combo, 'id'>) => {
    if (!combosRef) return;
    try {
        await addDoc(combosRef, { ...comboData, createdAt: serverTimestamp() });
        toast({ title: "Success", description: "Combo added." });
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not save combo." });
        console.error(e);
    }
  };

  const handleDeleteCombo = async (comboId: string) => {
    if (!combosRef) return;
    try {
        await deleteDoc(doc(combosRef, comboId));
        toast({ title: "Success", description: "Combo deleted." });
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
                      <Input id="item-image" type="file" />
                      <p className="text-xs text-muted-foreground">
                        Recommended size: 400x300 pixels for best fit on mobile.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Item Name</Label>
                      <Input id="name" name="name" value={currentItem.name} onChange={handleInputChange} placeholder="e.g. Classic Burger" />
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
                      </RadioGroup>
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
                     <div className="space-y-2">
                         <Label htmlFor="duration">Preparation Duration (in mins)</Label>
                         <Input id="duration" name="duration" type="number" value={currentItem.duration} onChange={handleInputChange} placeholder="e.g. 15" />
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
                  <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveItem}>{isEditingItem ? 'Save Changes' : 'Save Item'}</Button>
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
                                {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
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
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteItem(item.id)}>Delete</DropdownMenuItem>
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
                            <Input id="category-image-edit" type="file" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Category Name</Label>
                            <Input id="name" value={currentCategory.name} onChange={handleCategoryInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea id="description" value={currentCategory.description} onChange={handleCategoryInputChange} />
                        </div>
                        <div className="space-y-3">
                            <Label>Available Days of Week</Label>
                            <div className="grid grid-cols-3 gap-2 rounded-md border p-4">
                                {daysOfWeek.map((day) => (
                                    <div key={day.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`edit-${day.id}`}
                                            checked={(currentCategory.availableDays || []).includes(day.id)}
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
                                <Label htmlFor="from-time-edit" className="text-xs">From</Label>
                                <Input id="fromTime" type="time" value={currentCategory.fromTime} onChange={handleCategoryInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="to-time-edit" className="text-xs">To</Label>
                                <Input id="toTime" type="time" value={currentCategory.toTime} onChange={handleCategoryInputChange} />
                            </div>
                            </div>
                        </div>
                        </div>
                    </ScrollArea>
                    <SheetFooter>
                    <Button variant="outline" onClick={() => setIsCategorySheetOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveCategory}><Save className="mr-2" />{isEditingCategory ? 'Save Changes' : 'Save Category'}</Button>
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
                                checked={category.active}
                                onCheckedChange={(checked) => handleCategoryToggleSwitch(category.id, checked)}
                            />
                            <label htmlFor={`category-toggle-${category.id}`} className="text-sm font-medium">
                                {category.active ? 'Active' : 'Inactive'}
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
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(category.id)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardFooter>
                </Card>
                ))}
            </div>
            {categories.length === 0 && !categoriesLoading && (
                 <div className="mt-4 text-center text-muted-foreground">
                    <p>No categories have been added yet.</p>
                </div>
            )}
        </TabsContent>
        <TabsContent value="combo">
            <div className="flex justify-end">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2" /> Add Combo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                        <DialogTitle>Create New Combo</DialogTitle>
                        <DialogDescription>
                            Bundle items together to create an attractive offer.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="combo-name">Combo Name</Label>
                                    <Input id="combo-name" placeholder="e.g. Super Saver Combo" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="combo-price">Price ({format(0).substring(0,1)})</Label>
                                    <Input id="combo-price" type="number" placeholder="e.g. 299" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="combo-description">Description</Label>
                                <Textarea id="combo-description" placeholder="Describe the combo offer..." />
                            </div>
                            <div className="space-y-4">
                                <Label>Select Items</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search for items..." 
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <ScrollArea className="h-48 rounded-md border">
                                    <div className="p-4">
                                        {filteredComboItems.length > 0 ? filteredComboItems.map(item => (
                                            <div key={item.id} className="flex items-center space-x-2 py-2">
                                                <Checkbox 
                                                    id={`item-${item.id}`}
                                                    onCheckedChange={(checked) => handleItemCheckboxChange(item.name, !!checked)}
                                                    checked={selectedItems.includes(item.name)}
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
                        <DialogFooter>
                            <Button variant="outline">Cancel</Button>
                            <Button type="submit">Save Combo</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <Card className="mt-4">
              <CardContent className="pt-6">
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
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCombo(combo.id)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    