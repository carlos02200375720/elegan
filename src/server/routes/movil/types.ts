import { Bucket } from "@google-cloud/storage";
import { User, Reel, Product, Order } from "../../types";

export interface MovilRouterDependencies {
  MongoUser: any;
  MongoProduct: any;
  MongoReel: any;
  MongoOrder: any;
  MongoPublicacion: any;
  getUsers?: () => Promise<User[]>;
  getReels: () => Reel[];
  setReels: (reels: Reel[]) => void;
  getProducts: () => Product[];
  setProducts?: (products: Product[]) => void;
  getOrders: () => Order[];
  setOrders: (orders: Order[]) => void;
  uploadToGCS: (file: Express.Multer.File, folder?: string) => Promise<string>;
  uploadSingleSafe: (fieldName: string) => any;
  uploadBase64ToGCS: (base64Str: string, folder?: string) => Promise<string>;
  broadcastToAll: (data: any) => void;
  generateId: () => string;
  bucket?: Bucket;
  bucketName?: string;
  hlsQueue?: {
    enqueueAndWait: (
      jobId: string,
      videoBuffer: Buffer,
      sourceName: string,
      bucket: Bucket,
      bucketName: string,
      options?: {
        reelId?: string;
        publicacionId?: string;
        onComplete?: (result: any) => Promise<void> | void;
        onError?: (err: Error) => void;
      }
    ) => Promise<any>;
  };
}
