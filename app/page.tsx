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
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Walrus Blob Upload</h1>
        <p style={{ color: '#4B5563', marginBottom: '2rem' }}>
          An example uploading and displaying files with Walrus.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Blob Upload Section */}
          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Blob Upload</h2>
            <p style={{ color: '#4B5563', marginBottom: '1rem' }}>
              Upload blobs to Walrus, and display them on this page. See the{' '}
              <a href="https://docs.walrus.space" style={{ color: '#3B82F6', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">
                Walrus documentation
              </a>{' '}
              for more information. The file size is limited to 10 MiB on the default publisher. Use the{' '}
              <a href="https://docs.walrus.space/cli" style={{ color: '#3B82F6', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">
                CLI tool
              </a>{' '}
              to store bigger files.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Walrus publisher URL
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #E5E7EB', borderRadius: '0.375rem' }}
                  value={publisherUrl}
                  onChange={(e) => setPublisherUrl(e.target.value)}
                  placeholder="https://publisher.testnet.walrus.atalma.io"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Walrus aggregator URL
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #E5E7EB', borderRadius: '0.375rem' }}
                  value={aggregatorUrl}
                  onChange={(e) => setAggregatorUrl(e.target.value)}
                  placeholder="https://aggregator.testnet.walrus.atalma.io"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Blob to upload <span style={{ color: '#6B7280' }}>(Max 10 MiB size on the default publisher!)</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #E5E7EB', borderRadius: '0.375rem', backgroundColor: 'white' }}
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
                {error && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{error}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Epochs
                </label>
                <input
                  type="number"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #E5E7EB', borderRadius: '0.375rem' }}
                  value={epochs}
                  onChange={(e) => setEpochs(Math.max(1, Number(e.target.value)))}
                  min="1"
                />
                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem' }}>
                  The number of Walrus epochs for which to store the blob.
                </p>
              </div>

              <button 
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  transition: 'background-color 0.2s',
                  backgroundColor: isLoading || !file ? '#9CA3AF' : '#3B82F6',
                  color: 'white',
                  cursor: isLoading || !file ? 'not-allowed' : 'pointer',
                }}
                onClick={onUpload}
                disabled={isLoading || !file}
              >
                {isLoading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </section>

          {/* Uploaded Blobs Section */}
          {uploadedBlobs.length > 0 && (
            <section>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Uploaded Blobs</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {uploadedBlobs.map((blob) => (
                  <div key={blob.blobId} style={{ border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '1rem' }}>
                    <div style={{ aspectRatio: '16/9', position: 'relative', marginBottom: '1rem', backgroundColor: '#F3F4F6', borderRadius: '0.375rem', overflow: 'hidden' }}>
                      <img
                        src={`${aggregatorUrl}/v1/blobs/${blob.blobId}`}
                        alt="Uploaded content"
                        style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU1RTUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI0FBQUFBQSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPk5vIGltYWdlPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontWeight: '500' }}>Status:</span>
                        <span style={{ marginLeft: '0.5rem' }}>{blob.status}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '500' }}>Blob ID:</span>
                        <span style={{ 
                          color: '#4B5563', 
                          wordBreak: 'break-all',
                          fontSize: '0.875rem',
                          marginTop: '0.25rem'
                        }}>{blob.blobId}</span>
                      </div>
                      {blob.status === 'Already certified' && blob.previousEvent && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '500' }}>Previous Sui Certified Event:</span>
                          <span style={{ 
                            color: '#4B5563',
                            wordBreak: 'break-all',
                            fontSize: '0.875rem',
                            marginTop: '0.25rem'
                          }}>{blob.previousEvent.txDigest}</span>
                        </div>
                      )}
                      {blob.status === 'Newly created' && blob.suiObject && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '500' }}>Associated Sui Object:</span>
                          <span style={{ 
                            color: '#4B5563',
                            wordBreak: 'break-all',
                            fontSize: '0.875rem',
                            marginTop: '0.25rem'
                          }}>{blob.suiObject}</span>
                        </div>
                      )}
                      <div>
                        <span style={{ fontWeight: '500' }}>Stored until epoch:</span>
                        <span style={{ marginLeft: '0.5rem', color: '#4B5563' }}>{blob.endEpoch}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
