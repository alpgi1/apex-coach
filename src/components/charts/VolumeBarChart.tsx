import { Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

interface VolumeBarChartProps {
    data: { label: string; value: number }[];
}

const formatVolume = (v: number): string =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);

export default function VolumeBarChart({ data }: VolumeBarChartProps) {
    const barData = data.map((d) => ({
        value: d.value,
        label: d.label,
        frontColor: '#FF6000',
        topLabelComponent: () => (
            <Text
                style={{
                    color: '#8E8E93',
                    fontSize: 9,
                    marginBottom: 4,
                    textAlign: 'center',
                }}
            >
                {d.value > 0 ? formatVolume(d.value) : ''}
            </Text>
        ),
    }));

    const maxValue = Math.max(...data.map((d) => d.value), 100);

    return (
        <View>
            <BarChart
                data={barData}
                barWidth={28}
                spacing={12}
                noOfSections={4}
                maxValue={Math.ceil((maxValue * 1.15) / 100) * 100}
                backgroundColor="transparent"
                yAxisColor="transparent"
                xAxisColor="rgba(255,255,255,0.1)"
                yAxisTextStyle={{ color: '#8E8E93', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: '#8E8E93', fontSize: 9 }}
                hideRules={false}
                rulesColor="rgba(255,255,255,0.05)"
                roundedTop
                isAnimated
                animationDuration={600}
                disablePress
                yAxisLabelWidth={40}
                scrollToEnd
                scrollAnimation
                formatYLabel={(label: string) => formatVolume(Number(label))}
            />
        </View>
    );
}
