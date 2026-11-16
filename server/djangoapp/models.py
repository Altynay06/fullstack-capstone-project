from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class CarMake(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class CarModel(models.Model):
    car_make = models.ForeignKey(CarMake, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=[(x, x) for x in ['Sedan', 'SUV', 'Wagon', 'Truck', 'Coupe', 'Hatchback']])
    year = models.IntegerField(validators=[MinValueValidator(2015), MaxValueValidator(2023)])
    dealer_id = models.PositiveIntegerField(default=1)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['car_make', 'name', 'year', 'dealer_id'], name='unique_car_inventory')]

    def __str__(self):
        return f'{self.car_make} {self.name} ({self.year})'
