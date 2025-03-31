'use client';
import { useState, useRef } from 'react';

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

export default function Home() {
  const [publisherUrl, setPublisherUrl] = useState('https://publisher.walrus-testnet.walrus.space');
  const [aggregatorUrl, setAggregatorUrl] = useState('https://aggregator.walrus-testnet.walrus.space');
  const [file, setFile] = useState<File | null>(null);
  const [epochs, setEpochs] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedBlobs, setUploadedBlobs] = useState<UploadedBlob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onUpload = async () => {
    console.log('Upload details:', {
      publisherUrl,
      aggregatorUrl,
      file,
      epochs
    });

    if (!file) {
      console.error('No file selected');
      return;
    }

    setIsLoading(true);

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
        throw new Error('Failed to upload blob');
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
        throw new Error('Invalid response format');
      }

      setUploadedBlobs(prev => [newBlob, ...prev]);
      console.log('Blob uploaded successfully', newBlob);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-6xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-4">Walrus Blob Upload</h1>
        <p className="text-gray-600 mb-8">
          An example uploading and displaying files with Walrus.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Blob Upload Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Blob Upload</h2>
            <p className="text-gray-600 mb-4">
              Upload blobs to Walrus, and display them on this page. See the{' '}
              <a href="#" className="text-blue-500 hover:underline">
                Walrus documentation
              </a>{' '}
              for more information. The file size is limited to 10 MiB on the default publisher. Use the{' '}
              <a href="#" className="text-blue-500 hover:underline">
                CLI tool
              </a>{' '}
              to store bigger files.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Walrus publisher URL</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={publisherUrl}
                  onChange={(e) => setPublisherUrl(e.target.value)}
                  placeholder="https://publisher.testnet.walrus.atalma.io"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Walrus aggregator URL</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={aggregatorUrl}
                  onChange={(e) => setAggregatorUrl(e.target.value)}
                  placeholder="https://aggregator.testnet.walrus.atalma.io"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Blob to upload <span className="text-gray-500">(Max 10 MiB size on the default publisher!)</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="w-full p-2 border rounded bg-white"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Epochs</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={epochs}
                  onChange={(e) => setEpochs(Number(e.target.value))}
                  defaultValue={1}
                />
                <p className="text-sm text-gray-500 mt-1">
                  The number of Walrus epochs for which to store the blob.
                </p>
              </div>

              <button 
                className={`w-full py-2 px-4 rounded transition ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                onClick={onUpload}
                disabled={isLoading || !file}
              >
                {isLoading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </section>

          {/* Uploaded Blobs Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Uploaded Blobs</h2>
            {uploadedBlobs.length === 0 ? (
              <div className="border rounded-lg p-4">
                <div className="aspect-video relative mb-4 bg-gray-100 rounded overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    No file chosen
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className="ml-2">Waiting for upload</span>
                  </div>
                  <div>
                    <span className="font-medium">Blob ID:</span>
                    <span className="ml-2 text-gray-600">-</span>
                  </div>
                  <div>
                    <span className="font-medium">Associated Sui Object:</span>
                    <span className="ml-2 text-gray-600">-</span>
                  </div>
                  <div>
                    <span className="font-medium">Stored until epoch:</span>
                    <span className="ml-2 text-gray-600">-</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {uploadedBlobs.map((blob, index) => (
                  <div key={blob.blobId} className="border rounded-lg p-4">
                    <div className="aspect-video relative mb-4 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={`${aggregatorUrl}/v1/blobs/${blob.blobId}`}
                        alt="Uploaded content"
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Status:</span>
                        <span className="ml-2">{blob.status}</span>
                      </div>
                      <div>
                        <span className="font-medium">Blob ID:</span>
                        <span className="ml-2 text-gray-600">{blob.blobId}</span>
                      </div>
                      {blob.status === 'Already certified' && blob.previousEvent && (
                        <div>
                          <span className="font-medium">Previous Sui Certified Event:</span>
                          <span className="ml-2 text-gray-600">{blob.previousEvent.txDigest}</span>
                        </div>
                      )}
                      {blob.status === 'Newly created' && blob.suiObject && (
                        <div>
                          <span className="font-medium">Associated Sui Object:</span>
                          <span className="ml-2 text-gray-600">{blob.suiObject}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Stored until epoch:</span>
                        <span className="ml-2 text-gray-600">{blob.endEpoch}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
