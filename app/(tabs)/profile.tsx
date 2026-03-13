import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    return (
        <SafeAreaView className="flex-1 bg-[#1A1A1A] justify-center items-center">
            <Text className="text-white text-xl font-bold">Profile</Text>
        </SafeAreaView>
    );
}