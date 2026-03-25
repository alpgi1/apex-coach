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
                thickness={3}
                curved
                isAnimated
                animationDuration={800}
                backgroundColor="transparent"
                yAxisColor="transparent"
                xAxisColor="transparent"
                yAxisTextStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Outfit_400Regular' }}
                xAxisLabelTextStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Outfit_400Regular' }}
                rulesColor="rgba(255,255,255,0.06)"
                rulesType="solid"
                dataPointsColor="#FFFFFF"
                dataPointsRadius={4}
                maxValue={Math.ceil(maxVal + padding)}
                noOfSections={4}
                yAxisLabelWidth={45}
                formatYLabel={(label: string) => `${Number(label).toFixed(0)}kg`}
                scrollAnimation
                hideDataPoints={data.length > 15}
                startFillColor="rgba(0,201,167,0.4)"
                endFillColor="rgba(0,201,167,0.0)"
                startOpacity={0.8}
                endOpacity={0.0}
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
