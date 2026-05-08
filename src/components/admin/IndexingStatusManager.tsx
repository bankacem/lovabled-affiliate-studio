 import { useState } from "react";
 import { motion } from "framer-motion";
 import { 
   CheckCircle2, 
   Clock, 
   Search,
   ArrowUpDown,
   RefreshCw,
   Filter
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Badge } from "@/components/ui/badge";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { Checkbox } from "@/components/ui/checkbox";
 import { useSmartLinking } from "@/hooks/useSmartLinking";
 import { toast } from "sonner";
 import { format } from "date-fns";
 
 export function IndexingStatusManager() {
   const { 
     allPosts, 
     indexedPosts, 
     pendingPosts, 
     isLoading, 
     updateIndexingStatus, 
     bulkUpdateIndexingStatus,
     refetch 
   } = useSmartLinking();
   
   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState<"all" | "indexed" | "pending">("all");
   const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
   const [isUpdating, setIsUpdating] = useState(false);
 
   // Filter posts
   const filteredPosts = allPosts.filter(post => {
     const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.slug.toLowerCase().includes(searchQuery.toLowerCase());
     const matchesStatus = statusFilter === "all" || post.indexing_status === statusFilter;
     return matchesSearch && matchesStatus;
   });
 
   const handleToggleStatus = async (postId: string, currentStatus: "indexed" | "pending") => {
     const newStatus = currentStatus === "indexed" ? "pending" : "indexed";
     setIsUpdating(true);
     const success = await updateIndexingStatus(postId, newStatus);
     setIsUpdating(false);
     
     if (success) {
       toast.success(`Post marked as ${newStatus}`);
     } else {
       toast.error("Failed to update status");
     }
   };
 
   const handleBulkUpdate = async (status: "indexed" | "pending") => {
     if (selectedPosts.length === 0) {
       toast.error("No posts selected");
       return;
     }
 
     setIsUpdating(true);
     const success = await bulkUpdateIndexingStatus(selectedPosts, status);
     setIsUpdating(false);
     
     if (success) {
       toast.success(`${selectedPosts.length} posts marked as ${status}`);
       setSelectedPosts([]);
     } else {
       toast.error("Failed to update posts");
     }
   };
 
   const handleSelectAll = () => {
     if (selectedPosts.length === filteredPosts.length) {
       setSelectedPosts([]);
     } else {
       setSelectedPosts(filteredPosts.map(p => p.id));
     }
   };
 
   const handleSelectPost = (postId: string) => {
     setSelectedPosts(prev => 
       prev.includes(postId) 
         ? prev.filter(id => id !== postId)
         : [...prev, postId]
     );
   };
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-center justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               <ArrowUpDown className="h-5 w-5" />
               Indexing Status Manager
             </CardTitle>
             <CardDescription>
               Control which articles are marked as indexed vs pending for smart internal linking
             </CardDescription>
           </div>
           <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
             <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
             Refresh
           </Button>
         </div>
       </CardHeader>
       <CardContent className="space-y-4">
         {/* Stats */}
         <div className="grid grid-cols-3 gap-4">
           <div className="p-4 rounded-lg bg-muted/50 text-center">
             <p className="text-2xl font-bold text-foreground">{allPosts.length}</p>
             <p className="text-sm text-muted-foreground">Total Posts</p>
           </div>
           <div className="p-4 rounded-lg bg-green-500/10 text-center">
             <p className="text-2xl font-bold text-green-600 dark:text-green-400">{indexedPosts.length}</p>
             <p className="text-sm text-muted-foreground">Indexed</p>
           </div>
           <div className="p-4 rounded-lg bg-amber-500/10 text-center">
             <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingPosts.length}</p>
             <p className="text-sm text-muted-foreground">Pending</p>
           </div>
         </div>
 
         {/* Filters & Actions */}
         <div className="flex flex-wrap items-center gap-3">
           <div className="relative flex-1 min-w-[200px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="Search posts..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9"
             />
           </div>
           
           <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
             <SelectTrigger className="w-[140px]">
               <Filter className="h-4 w-4 mr-2" />
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Status</SelectItem>
               <SelectItem value="indexed">Indexed</SelectItem>
               <SelectItem value="pending">Pending</SelectItem>
             </SelectContent>
           </Select>
 
           {selectedPosts.length > 0 && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="flex items-center gap-2"
             >
               <span className="text-sm text-muted-foreground">
                 {selectedPosts.length} selected
               </span>
               <Button 
                 size="sm" 
                 variant="outline"
                 onClick={() => handleBulkUpdate("indexed")}
                 disabled={isUpdating}
               >
                 <CheckCircle2 className="h-4 w-4 mr-1" />
                 Mark Indexed
               </Button>
               <Button 
                 size="sm" 
                 variant="outline"
                 onClick={() => handleBulkUpdate("pending")}
                 disabled={isUpdating}
               >
                 <Clock className="h-4 w-4 mr-1" />
                 Mark Pending
               </Button>
             </motion.div>
           )}
         </div>
 
         {/* Posts Table */}
         <div className="border rounded-lg overflow-hidden">
           <Table>
             <TableHeader>
               <TableRow className="bg-muted/50">
                 <TableHead className="w-12">
                   <Checkbox
                     checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                     onCheckedChange={handleSelectAll}
                   />
                 </TableHead>
                 <TableHead>Title</TableHead>
                 <TableHead className="w-[120px]">Category</TableHead>
                 <TableHead className="w-[120px]">Published</TableHead>
                 <TableHead className="w-[100px]">Status</TableHead>
                 <TableHead className="w-[100px]">Action</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredPosts.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                     No posts found
                   </TableCell>
                 </TableRow>
               ) : (
                 filteredPosts.map((post) => (
                   <TableRow key={post.id}>
                     <TableCell>
                       <Checkbox
                         checked={selectedPosts.includes(post.id)}
                         onCheckedChange={() => handleSelectPost(post.id)}
                       />
                     </TableCell>
                     <TableCell>
                       <div>
                         <p className="font-medium text-foreground line-clamp-1">{post.title}</p>
                         <p className="text-xs text-muted-foreground">/blog/{post.slug}</p>
                       </div>
                     </TableCell>
                     <TableCell>
                       <Badge variant="secondary" className="text-xs">
                         {post.category}
                       </Badge>
                     </TableCell>
                     <TableCell className="text-sm text-muted-foreground">
                       {post.published_at 
                         ? format(new Date(post.published_at), "MMM d, yyyy")
                         : "—"}
                     </TableCell>
                     <TableCell>
                       <Badge 
                         variant={post.indexing_status === "indexed" ? "default" : "outline"}
                         className={post.indexing_status === "indexed" 
                           ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
                           : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                         }
                       >
                         {post.indexing_status === "indexed" ? (
                           <><CheckCircle2 className="h-3 w-3 mr-1" /> Indexed</>
                         ) : (
                           <><Clock className="h-3 w-3 mr-1" /> Pending</>
                         )}
                       </Badge>
                     </TableCell>
                     <TableCell>
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => handleToggleStatus(post.id, post.indexing_status)}
                         disabled={isUpdating}
                       >
                         {post.indexing_status === "indexed" ? "Set Pending" : "Set Indexed"}
                       </Button>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </div>
       </CardContent>
     </Card>
   );
 }