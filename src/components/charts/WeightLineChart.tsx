import { Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

interface WeightLineChartProps {
    data: { date: string; weightKg: number }[]; // oldest → newest
}

export default function WeightLineChart({ data }: WeightLineChartProps) {
    if (data.length < 2) return null;

    const lineData = data.map((d) => ({
        value: d.weightKg,
        label: d.date.slice(5), // "MM-DD"
        dataPointText: '',
    }));

    const values = data.map((d) => d.weightKg);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = Math.max((maxVal - minVal) * 0.3, 1);

    return (
        <View>
            <LineChart
                data={lineData}
                color="#00C9A7"
                thickness={2}
                curved
                isAnimated
                animationDuration={600}
                backgroundColor="transparent"
                yAxisColor="transparent"
                xAxisColor="rgba(255,255,255,0.1)"
                yAxisTextStyle={{ color: '#8E8E93', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: '#8E8E93', fontSize: 9 }}
                rulesColor="rgba(255,255,255,0.05)"
                dataPointsColor="#00C9A7"
                dataPointsRadius={3}
                maxValue={Math.ceil(maxVal + padding)}
                noOfSections={4}
                yAxisLabelWidth={40}
                formatYLabel={(label: string) => `${Number(label).toFixed(0)}kg`}
                scrollAnimation
                hideDataPoints={data.length > 15}
                startFillColor="rgba(0,201,167,0.15)"
                endFillColor="transparent"
                areaChart
            />
            {minVal === maxVal && (
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                    Log more entries to see a trend
                </Text>
            )}
        </View>
    );
}
