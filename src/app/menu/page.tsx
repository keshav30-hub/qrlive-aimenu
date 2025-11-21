
'use client';

import { useState } from 'react';
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
import { PlusCircle, Trash2, MoreVertical, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrency } from '@/hooks/use-currency';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


type Addon = { name: string; price: string };
type Modifier = { name: string; price: string };

const initialItemState = {
  name: '',
  ingredients: '',
  description: '',
  mrp: '',
  type: 'veg',
  addons: [{ name: '', price: '' }],
  modifiers: [{ name: '', price: '' }],
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

const initialCategories = [
    {
      id: '1',
      name: 'Appetizers',
      description: 'Start your meal with our delicious appetizers.',
      imageUrl: 'https://picsum.photos/seed/cat1/600/400',
      imageHint: 'appetizer food',
      active: true,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      fromTime: '11:00',
      toTime: '23:00',
    },
    {
      id: '2',
      name: 'Main Course',
      description: 'Hearty and satisfying main courses.',
      imageUrl: 'https://picsum.photos/seed/cat2/600/400',
      imageHint: 'main course food',
      active: true,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      fromTime: '11:00',
      toTime: '23:00',
    },
    {
      id: '3',
      name: 'Desserts',
      description: 'Sweet treats to end your meal.',
      imageUrl: 'https://picsum.photos/seed/cat3/600/400',
      imageHint: 'dessert food',
      active: false,
      availableDays: ['friday', 'saturday', 'sunday'],
      fromTime: '18:00',
      toTime: '23:00',
    },
];

type Category = typeof initialCategories[0];
const defaultCategory: Omit<Category, 'id' | 'imageUrl' | 'imageHint'> = {
    name: '',
    description: '',
    active: true,
    availableDays: [],
    fromTime: '',
    toTime: '',
};

export default function MenuPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [newItem, setNewItem] = useState(initialItemState);
  const [categories, setCategories] = useState(initialCategories);
  const [currentCategory, setCurrentCategory] = useState<Omit<Category, 'id' | 'imageUrl' | 'imageHint'> & { id?: string }>(defaultCategory);
  
  const { format } = useCurrency();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioChange = (value: string) => {
    setNewItem(prev => ({ ...prev, type: value }));
  };

  const handleAddonChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const addons = [...newItem.addons];
    addons[index] = { ...addons[index], [name]: value };
    setNewItem(prev => ({ ...prev, addons }));
  };

  const handleModifierChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const modifiers = [...newItem.modifiers];
    modifiers[index] = { ...modifiers[index], [name]: value };
    setNewItem(prev => ({ ...prev, modifiers }));
  };

  const addAddonField = () => {
    setNewItem(prev => ({ ...prev, addons: [...prev.addons, { name: '', price: '' }] }));
  };

  const addModifierField = () => {
    setNewItem(prev => ({ ...prev, modifiers: [...prev.modifiers, { name: '', price: '' }] }));
  };
  
  const removeAddonField = (index: number) => {
    const addons = [...newItem.addons];
    addons.splice(index, 1);
    setNewItem(prev => ({ ...prev, addons }));
  };

  const removeModifierField = (index: number) => {
    const modifiers = [...newItem.modifiers];
    modifiers.splice(index, 1);
    setNewItem(prev => ({ ...prev, modifiers }));
  };

  const handleEditCategoryClick = (category: Category) => {
    setIsEditingCategory(true);
    setCurrentCategory(category);
    setIsCategorySheetOpen(true);
  };

  const handleCategoryToggleSwitch = (categoryId: string, active: boolean) => {
    setCategories(categories.map(cat => cat.id === categoryId ? { ...cat, active } : cat));
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

  const handleSaveCategory = () => {
    // Logic to save category will go here
    setIsCategorySheetOpen(false);
  }

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
                <Button>
                  <PlusCircle className="mr-2" /> Add Item
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Add New Menu Item</SheetTitle>
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
                      <Input id="name" name="name" value={newItem.name} onChange={handleInputChange} placeholder="e.g. Classic Burger" />
                    </div>
                     <div className="space-y-2">
                      <Label>Type</Label>
                       <RadioGroup
                        defaultValue="veg"
                        className="flex gap-4"
                        onValueChange={handleRadioChange}
                        value={newItem.type}
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
                      <Textarea id="ingredients" name="ingredients" value={newItem.ingredients} onChange={handleInputChange} placeholder="e.g. Patty, Lettuce, Tomato, Cheese" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" value={newItem.description} onChange={handleInputChange} placeholder="Describe the item..." />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="mrp">MRP ({format(0).substring(0,1)})</Label>
                        <Input id="mrp" name="mrp" type="number" value={newItem.mrp} onChange={handleInputChange} placeholder="e.g. 150" />
                    </div>
                    <Accordion type="multiple" className="w-full">
                      <AccordionItem value="add-ons">
                        <AccordionTrigger>Add-ons</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {newItem.addons.map((addon, index) => (
                            <div key={index} className="flex gap-2 items-end">
                              <div className="grid w-full gap-2">
                                <Label htmlFor={`addon-name-${index}`}>Name</Label>
                                <Input id={`addon-name-${index}`} name="name" value={addon.name} onChange={(e) => handleAddonChange(index, e)} placeholder="e.g. Extra Cheese" />
                              </div>
                              <div className="grid w-full gap-2">
                                <Label htmlFor={`addon-price-${index}`}>Price</Label>
                                <Input id={`addon-price-${index}`} name="price" type="number" value={addon.price} onChange={(e) => handleAddonChange(index, e)} placeholder="e.g. 30" />
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeAddonField(index)} disabled={newItem.addons.length === 1}>
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
                          {newItem.modifiers.map((modifier, index) => (
                            <div key={index} className="flex gap-2 items-end">
                              <div className="grid w-full gap-2">
                                <Label htmlFor={`modifier-name-${index}`}>Name</Label>
                                <Input id={`modifier-name-${index}`} name="name" value={modifier.name} onChange={(e) => handleModifierChange(index, e)} placeholder="e.g. Small" />
                              </div>
                              <div className="grid w-full gap-2">
                                <Label htmlFor={`modifier-price-${index}`}>Price</Label>
                                <Input id={`modifier-price-${index}`} name="price" type="number" value={modifier.price} onChange={(e) => handleModifierChange(index, e)} placeholder="e.g. 90" />
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeModifierField(index)} disabled={newItem.modifiers.length === 1}>
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
                  <Button onClick={() => { /* Handle Save */ setIsSheetOpen(false); }}>Save Item</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
          {/* Item listing will go here */}
          <div className="mt-4 text-center text-muted-foreground">
            <p>No items have been added yet.</p>
          </div>
        </TabsContent>
        <TabsContent value="category">
           <div className="flex justify-end mb-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2" /> Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your new menu category.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input id="category-name" placeholder="e.g. Appetizers" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category-image">Category Image</Label>
                    <Input id="category-image" type="file" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category-description">Description (Optional)</Label>
                    <Textarea id="category-description" placeholder="Describe the category..." />
                  </div>
                  <div className="space-y-3">
                    <Label>Available Days of Week</Label>
                    <div className="grid grid-cols-3 gap-2 rounded-md border p-4">
                        {daysOfWeek.map((day) => (
                            <div key={day.id} className="flex items-center space-x-2">
                                <Checkbox id={day.id} />
                                <Label htmlFor={day.id} className="font-normal text-sm">{day.label}</Label>
                            </div>
                        ))}
                    </div>
                  </div>
                   <div className="space-y-2">
                    <Label>Available Duration</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="from-time" className="text-xs">From</Label>
                        <Input id="from-time" type="time" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="to-time" className="text-xs">To</Label>
                        <Input id="to-time" type="time" />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Category</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
            <Sheet open={isCategorySheetOpen} onOpenChange={setIsCategorySheetOpen}>
                <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader>
                    <SheetTitle>Edit Category</SheetTitle>
                    <SheetDescription>
                        Update the details for your menu category.
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
                                            checked={currentCategory.availableDays.includes(day.id)}
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
                    <Button onClick={handleSaveCategory}><Save className="mr-2" />Save Changes</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                <Card key={category.id} className="overflow-hidden flex flex-col">
                    <div className="relative w-full h-40">
                        <Image
                            src={category.imageUrl}
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
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardFooter>
                </Card>
                ))}
            </div>
            {categories.length === 0 && (
                 <div className="mt-4 text-center text-muted-foreground">
                    <p>No categories have been added yet.</p>
                </div>
            )}
        </TabsContent>
        <TabsContent value="combo">
          <div className="mt-4 text-center text-muted-foreground">
            <p>Combo offer management will be available here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    