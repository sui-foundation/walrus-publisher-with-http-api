'use client';
import { useState, useRef } from 'react';
import { LottieAnimation } from "@/components/lottieAnimation";
import { montreal, mondwest } from "@/lib/fonts";
import Link from 'next/link';
import { ImageUp, Image, ArrowRight } from 'lucide-react';
import { ImageCard } from '@/components/imageCard';

interface BlobEvent {
  txDigest: string;
  eventSeq: string;
}

interface BlobStorage {
  id: string;
  startEpoch: number;
  endEpoch: number;
  storageSize: number;
}

interface BlobObject {
  id: string;
  registeredEpoch: number;
  blobId: string;
  size: number;
  encodingType: string;
  certifiedEpoch: number;
  storage: BlobStorage;
  deletable: boolean;
}

interface PublisherResponse {
  newlyCreated?: {
    blobObject: BlobObject;
    resourceOperation: {
      registerFromScratch: {
        encodedLength: number;
        epochsAhead: number;
      };
    };
    cost: number;
  };
  alreadyCertified?: {
    blobId: string;
    event: BlobEvent;
    endEpoch: number;
  };
}

interface UploadedBlob {
  status: 'Already certified' | 'Newly created';
  blobId: string;
  suiObject?: string;
  endEpoch: number;
  previousEvent?: BlobEvent;
  fileType: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB in bytes

export default function Home() {
  const [publisherUrl, setPublisherUrl] = useState('https://publisher.walrus-testnet.walrus.space');
  const [aggregatorUrl, setAggregatorUrl] = useState('https://aggregator.walrus-testnet.walrus.space');
  const [file, setFile] = useState<File | null>(null);
  const [epochs, setEpochs] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedBlobs, setUploadedBlobs] = useState<UploadedBlob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10 MiB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)} MiB`;
    }
    return null;
  };

  const onUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    const fileError = validateFile(file);
    if (fileError) {
      setError(fileError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${publisherUrl}/v1/blobs?epochs=${epochs}`, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Length': file.size.toString(),
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const publisherData = await response.json() as PublisherResponse;
      
      let newBlob: UploadedBlob;
      
      if (publisherData.newlyCreated) {
        newBlob = {
          status: 'Newly created',
          blobId: publisherData.newlyCreated.blobObject.blobId,
          suiObject: publisherData.newlyCreated.blobObject.id,
          endEpoch: publisherData.newlyCreated.blobObject.storage.endEpoch,
          fileType: file.type || 'application/octet-stream'
        };
      } else if (publisherData.alreadyCertified) {
        newBlob = {
          status: 'Already certified',
          blobId: publisherData.alreadyCertified.blobId,
          endEpoch: publisherData.alreadyCertified.endEpoch,
          previousEvent: publisherData.alreadyCertified.event,
          fileType: file.type || 'application/octet-stream'
        };
      } else {
        throw new Error('Invalid response format from server');
      }

      setUploadedBlobs(prev => [newBlob, ...prev]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 h-full min-h-[750px] ${montreal.className}`}>
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl bg-[#0d0f1d]">
        {/* Left half */}
        <div className="absolute left-0 top-0 h-full md:w-[336px] w-[152px] overflow-hidden [clip-path:inset(0)]">
          <div
            className="absolute inset-0 bg-gradient-to-l from-[#0c0f1d] from-30% to-[#0c0f1d00] to-80%"
            style={{
              zIndex: 2,
            }}
          />
          <LottieAnimation
            src="/animations/grid_loop.lottie"
            autoplay
            loop
            layout={{ fit: "cover", align: [0, 0] }}
            renderConfig={{ autoResize: true }}
          />
        </div>

        {/* Right half */}
        <div className="absolute right-0 top-0 h-full md:w-[336px] w-[152px] overflow-hidden [clip-path:inset(0)]">
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#0c0f1d] from-30% to-[#0c0f1d00] to-80%"
            style={{
              zIndex: 2,
            }}
          />
          <LottieAnimation
            src="/animations/grid_loop.lottie"
            style={{ transform: "rotate(180deg)" }}
            autoplay
            loop
            layout={{ fit: "cover", align: [0.01, 0] }}
            renderConfig={{ autoResize: true }}
          />
        </div>
      </div>
      <main className="flex flex-col items-center gap-4 mt-16 mb-8">
        <h1 className={`${mondwest.className} text-7xl`}>Upload Blob</h1>
        <p className={`${montreal.className} max-w-[530px] text-[#F7F7F7] text-lg text-center`}>
          Upload blobs to Walrus, and display them on this page. See the <Link href="https://docs.wal.app" className="text-[#C684F6] underline" target="_blank" rel="noopener noreferrer">Walrus documentation</Link> for more information. The file size is limited to 10 MiB on the default publisher. Use the <Link href="https://docs.wal.app/usage/client-cli.html" className="text-[#C684F6] underline" target="_blank" rel="noopener noreferrer">CLI tool</Link> to store bigger files.
        </p>

        <div className={`grid ${uploadedBlobs.length > 0 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-8 w-full max-w-[1200px]`}>
          {/* Blob Upload Section */}
          <section className={`w-full ${uploadedBlobs.length > 0 ? 'max-w-[550px]' : 'max-w-[550px] mx-auto'}`}>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Walrus publisher URL
                </label>
                <input
                  type="text"
                  className="w-full p-2 bg-[#0C0F1D] border-2 border-[#97F0E599] rounded-md"
                  value={publisherUrl}
                  onChange={(e) => setPublisherUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Walrus aggregator URL
                </label>
                <input
                  type="text"
                  className="w-full p-2 bg-[#0C0F1D] border-2 border-[#97F0E599] rounded-md"
                  value={aggregatorUrl}
                  onChange={(e) => setAggregatorUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Blob to upload
                </label>
                <div className="w-full p-2 bg-[#0C0F1D] border-2 border-[#97F0E599] rounded-md">
                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [&::-webkit-file-upload-button]:hidden [&::file-selector-button]:hidden"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) {
                          const fileError = validateFile(selectedFile);
                          if (fileError) {
                            setError(fileError);
                            setFile(null);
                          } else {
                            setError(null);
                            setFile(selectedFile);
                          }
                        }
                      }}
                    />
                    <div className="w-full p-2 border border-2 border-[#97F0E599] border-dashed rounded-md flex items-center justify-center min-h-[100px]">
                      {file ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Image size={56} strokeWidth={1} className="text-[#97F0E5]" />
                          <p className="text-[#F7F7F7]">{file.name}</p>
                          <p className="text-sm text-[#F7F7F7]">{(file.size / (1024 * 1024)).toFixed(2)} MiB</p>
                          <button className="border border-[#C684F6] rounded-md px-2 py-1 text-sm text-[#C684F6]">
                            CHOOSE FILE
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ImageUp size={56} strokeWidth={1} className="text-[#97F0E5]" />
                          <p className="text-[#FFFFFF]">Drag & drop a file</p>
                          <p className="text-sm text-[#F7F7F7]">Max 10 MiB size on the default publisher.</p>
                          <button className="border border-[#C684F6] rounded-md px-2 py-1 text-sm text-[#C684F6]">
                            CHOOSE FILE
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Epochs
                </label>
                <input
                  type="number"
                  className="w-full p-2 bg-[#0C0F1D] border-2 border-[#97F0E599] rounded-md"
                  value={epochs}
                  onChange={(e) => setEpochs(Math.max(1, Number(e.target.value)))}
                  min="1"
                />
                <p className="text-sm opacity-50 text-[#F7F7F7] mt-1">
                  The number of Walrus epochs for which to store the blob.
                </p>
              </div>

              <button 
                className={`text-[#0C0F1D] w-full py-2 px-4 rounded-md transition-colors duration-200 ${
                  isLoading || !file 
                    ? 'bg-[#97F0E5]/50 cursor-not-allowed' 
                    : 'bg-[#97F0E5] hover:bg-[#97F0E5]/80 cursor-pointer'
                }`}
                onClick={onUpload}
              >
                {
                  isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      Uploading...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Upload</span>
                      <ArrowRight size={16} strokeWidth={1} />
                    </div>
                  )
                }
              </button>
            </div>
          </section>

          {/* Uploaded Blobs Section */}
          {uploadedBlobs.length > 0 && (
            <section className='w-full max-w-[550px]'>
              <h2>Uploads <span className='opacity-50 '>{uploadedBlobs.length}</span></h2>
              <div className="relative">
                <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {uploadedBlobs.map((blob) => {
                    if (blob.status === 'Newly created') {
                      return (
                        <ImageCard
                          key={blob.blobId}
                          blobId={blob.blobId}
                          endEpoch={blob.endEpoch}
                          imageUrl={`${aggregatorUrl}/v1/blobs/${blob.blobId}`}
                          status="newly created"
                          suiObjectId={blob.suiObject!}
                        />
                      );
                    } else {
                      return (
                        <ImageCard
                          key={blob.blobId}
                          blobId={blob.blobId}
                          endEpoch={blob.endEpoch}
                          imageUrl={`${aggregatorUrl}/v1/blobs/${blob.blobId}`}
                          status="already certified"
                          suiEventId={blob.previousEvent!.txDigest}
                        />
                      );
                    }
                  })}
                </div>
                {uploadedBlobs.length >= 4 && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0d0f1d] to-transparent pointer-events-none" />
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
