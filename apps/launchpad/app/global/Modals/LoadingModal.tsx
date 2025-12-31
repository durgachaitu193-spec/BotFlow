import Image from 'next/image'
import Modal from '@/ui-components/Modal'
import Spinner from '@/ui-components/Spinner'

const LoadingModal = ({
  onClose,
  open,
  message,
}: {
  onClose?: () => void
  open: boolean
  message?: string
}) => {
  return (
    <Modal
      centered
      onCancel={onClose}
      open={open}
      footer={null}
      closable={false}
      className='w-[400px]'
    >
      <div className='flex flex-col gap-y-2'>
        <div className='relative flex'>
          <Image
            src='/assets/loading-meme.jpg'
            alt='loading meme'
            height={200}
            width={400}
            className='rounded-lg'
          />
          <div className='absolute top-[43%] left-[47%]'>
            <Spinner />
          </div>
        </div>
        <p className='text-center font-bold text-white'>{message}</p>
      </div>
    </Modal>
  )
}

export default LoadingModal
