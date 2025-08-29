from django.db import models
from django.contrib.auth.models import AbstractUser

class Member(AbstractUser):
    department_name = models.CharField(max_length=200)
    application = models.ManyToManyField('Application', related_name='app')
    def __str__(self):
        return self.last_name+self.first_name

class Application(models.Model):
    name = models.CharField(max_length=200, primary_key=True)
    api_url = models.CharField(max_length=500)
    api_key = models.CharField(max_length=100)
    type = models.CharField(max_length=100,default='')
    member = models.ManyToManyField('Member', related_name='member')
    icon = models.CharField(max_length=100,default='Waypoints')
    def __str__(self):
        return self.name

class Model_info(models.Model):
    show_name = models.CharField(max_length=200,unique=True)
    model_url = models.CharField(max_length=500)
    model_key = models.CharField(max_length=100,null=True)
    model_type = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100,default='')
    model_provider = models.CharField(max_length=100,default='')
    model_providerId = models.CharField(max_length=100,default='')
    def __str__(self):
        return self.show_name