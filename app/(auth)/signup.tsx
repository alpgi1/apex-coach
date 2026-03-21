import { Link } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedBackground from '../../src/components/layout/AnimatedBackground';
import { useAuthStore } from '../../src/store/authStore';

export default function SignupScreen() {
    const { signUp, isLoading } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    const handleSignup = async () => {
        if (!email.trim() || !password) {
            Alert.alert('Error', 'Email and password are required.');
            return;
        }
        if (password !== passwordConfirm) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters.');
            return;
        }
        try {
            await signUp(email.trim(), password);
        } catch (e: any) {
            Alert.alert('Sign up failed', e.message ?? 'An error occurred.');
        }
    };

    return (
        <View style={styles.root}>
            <AnimatedBackground intensity={50} />
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        contentContainerStyle={styles.scroll}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.logo}>APEX</Text>
                            <Text style={styles.tagline}>Create your account</Text>
                        </View>

                        {/* Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Sign Up</Text>

                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="you@example.com"
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                style={styles.input}
                            />

                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                secureTextEntry
                                style={styles.input}
                            />

                            <Text style={styles.label}>Confirm Password</Text>
                            <TextInput
                                value={passwordConfirm}
                                onChangeText={setPasswordConfirm}
                                placeholder="••••••••"
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                secureTextEntry
                                style={[styles.input, { marginBottom: 28 }]}
                            />

                            <TouchableOpacity
                                onPress={handleSignup}
                                disabled={isLoading}
                                activeOpacity={0.75}
                                style={[styles.button, isLoading && styles.buttonDisabled]}
                            >
                                <Text style={styles.buttonText}>
                                    {isLoading ? 'Creating account...' : 'Create Account'}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Already have an account? </Text>
                                <Link href={'/(auth)/login' as any} asChild>
                                    <Pressable>
                                        <Text style={styles.footerLink}>Sign in</Text>
                                    </Pressable>
                                </Link>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 48,
        color: '#FF6000',
        letterSpacing: 4,
    },
    tagline: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 6,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 28,
    },
    cardTitle: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 20,
        color: 'white',
        marginBottom: 24,
    },
    label: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: 'white',
        fontFamily: 'Outfit_400Regular',
        fontSize: 15,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#FF6000',
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonDisabled: {
        backgroundColor: '#CC4D00',
    },
    buttonText: {
        fontFamily: 'Outfit_700Bold',
        color: 'white',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
    },
    footerLink: {
        fontFamily: 'Outfit_600SemiBold',
        color: '#FF6000',
        fontSize: 14,
    },
});
