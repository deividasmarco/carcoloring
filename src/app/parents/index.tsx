import { useRouter } from 'expo-router';
import { ParentScreen } from '../../features/parents/ParentScreen';

export default function ParentsRoute() {
  const router = useRouter();
  return <ParentScreen onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
}
