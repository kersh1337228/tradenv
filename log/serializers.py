from rest_framework import serializers
from log.models import Log


class LogSerializer(serializers.ModelSerializer):
    time_interval_start = serializers.DateField(format='%Y/%m/%d')
    time_interval_end = serializers.DateField(format='%Y/%m/%d')

    def create(self, validated_data=None):
        return LogSerializer(Log.objects.create(**self.validated_data))

    class Meta:
        model = Log
        fields = '__all__'
