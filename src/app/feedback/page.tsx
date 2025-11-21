
'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Star, Smile, Meh, Frown, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

const initialFeedbackData = [
  {
    id: 1,
    datetime: '2023-11-28T14:30:00',
    tableName: 'Table 3',
    description: 'The pasta was a bit cold, but the service was excellent. Our waiter, John, was very attentive.',
    imageUrl: 'https://picsum.photos/seed/f1/300/200',
    rating: 4,
  },
  {
    id: 2,
    datetime: '2023-11-28T12:05:00',
    tableName: 'Table 7',
    description: 'Everything was perfect! The steak was cooked exactly as I requested. Will definitely come back.',
    imageUrl: '',
    rating: 5,
  },
  {
    id: 3,
    datetime: '2023-11-27T19:45:00',
    tableName: 'Table 1',
    description: 'The music was too loud, and we had to wait 30 minutes for our drinks.',
    imageUrl: 'https://picsum.photos/seed/f2/300/200',
    rating: 2,
  },
  {
    id: 4,
    datetime: '2023-11-27T18:00:00',
    tableName: 'Table 5',
    description: 'An average experience. The food was okay, nothing special. The ambiance is nice though.',
    imageUrl: '',
    rating: 3,
  },
  {
    id: 5,
    datetime: '2023-11-26T20:15:00',
    tableName: 'Table 9',
    description: 'Terrible. My order was wrong and it took forever to get it corrected.',
    imageUrl: '',
    rating: 1,
  },
  {
    id: 6,
    datetime: '2023-11-26T13:00:00',
    tableName: 'Table 2',
    description: 'Lovely lunch spot. The salad was fresh and the dessert was divine. Highly recommend!',
    imageUrl: 'https://picsum.photos/seed/f3/300/200',
    rating: 5,
  },
];


const getMood = (rating: number) => {
  if (rating >= 4) return { icon: <Smile className="text-green-500" />, label: 'Happy' };
  if (rating === 3) return { icon: <Meh className="text-yellow-500" />, label: 'Neutral' };
  return { icon: <Frown className="text-red-500" />, label: 'Sad' };
};

const ITEMS_PER_PAGE = 10;

export default function FeedbackPage() {
  const [feedbackList] = useState(initialFeedbackData);
  const [currentPage, setCurrentPage] = useState(1);

  const totalReviews = feedbackList.length;
  const averageRating = totalReviews > 0
    ? (feedbackList.reduce((acc, f) => acc + f.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  const ratingCounts = feedbackList.reduce((acc, f) => {
    acc[f.rating] = (acc[f.rating] || 0) + 1;
    return acc;
  }, {} as { [key: number]: number });
  
  for (let i = 1; i <= 5; i++) {
    if (!ratingCounts[i]) {
      ratingCounts[i] = 0;
    }
  }

  const totalPages = Math.ceil(feedbackList.length / ITEMS_PER_PAGE);

  const paginatedFeedback = feedbackList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Feedback</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ratings Summary</CardTitle>
          <CardDescription>Overall customer feedback summary.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center justify-center space-y-2 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h3 className="text-4xl font-bold">{averageRating}</h3>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < Math.round(Number(averageRating))
                        ? 'fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }
                  />
                ))}
              </div>
              <p className="text-muted-foreground">Based on {totalReviews} reviews</p>
            </div>
            <div className="md:col-span-2 space-y-4">
              {Object.entries(ratingCounts)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([rating, count]) => (
                <div key={rating} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground w-12">{rating} Star</span>
                  <Progress value={(count / totalReviews) * 100} className="w-full h-3" />
                  <span className="text-sm font-semibold w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback History</CardTitle>
          <CardDescription>Detailed list of all feedback received.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Table Name</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Image</TableHead>
                <TableHead className="text-center">Mood</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFeedback.map((feedback) => (
                <Dialog key={feedback.id}>
                  <DialogTrigger asChild>
                    <TableRow className="cursor-pointer">
                      <TableCell className="font-medium">{feedback.id}</TableCell>
                      <TableCell>{new Date(feedback.datetime).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell>{new Date(feedback.datetime).toLocaleTimeString()}</TableCell>
                      <TableCell>{feedback.tableName}</TableCell>
                      <TableCell className="max-w-xs truncate">{feedback.description}</TableCell>
                      <TableCell>
                        {feedback.imageUrl ? (
                           <ImageIcon className="h-5 w-5" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="flex justify-center items-center">
                        {getMood(feedback.rating).icon}
                      </TableCell>
                    </TableRow>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Feedback from {feedback.tableName}</DialogTitle>
                      <DialogDescription>
                        {new Date(feedback.datetime).toLocaleDateString('en-GB')} at {new Date(feedback.datetime).toLocaleTimeString()}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={i < feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                          />
                        ))}
                      </div>
                      <p className="text-sm">{feedback.description}</p>
                      {feedback.imageUrl && (
                        <div className="relative mt-4 h-64 w-full">
                          <Image src={feedback.imageUrl} alt={`Feedback from ${feedback.tableName}`} layout="fill" objectFit="contain" />
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </TableBody>
          </Table>
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
    </div>
  );
}
